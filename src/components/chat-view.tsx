"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "../../supabase/client";

interface ChatViewProps {
  userId: string;
  initialMatch?: any;
}

export default function ChatView({ userId, initialMatch }: ChatViewProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(initialMatch || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMatches();
  }, [userId]);

  useEffect(() => {
    if (initialMatch) {
      setSelectedMatch(initialMatch);
    }
  }, [initialMatch]);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
      markMessagesAsRead(selectedMatch.id);
      const cleanup = subscribeToMessages(selectedMatch.id);
      return cleanup;
    }
  }, [selectedMatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMatches = async () => {
    const supabase = createClient();
    
    // Only get matches where current user is user1 to avoid duplicates
    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", userId);

    const matchDetails = await Promise.all(
      (matchesData || []).map(async (match) => {
        const otherId = match.user2_id; // Always user2 since we filtered for user1_id
        const { data: otherUser } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("user_id", otherId)
          .single();

        // Get unread message count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id)
          .eq("read", false)
          .neq("sender_id", userId);

        return { ...match, otherUser, otherId, unreadCount: count || 0 };
      })
    );

    setMatches(matchDetails);
    
    // Update unread counts
    const counts: Record<string, number> = {};
    matchDetails.forEach(match => {
      counts[match.id] = match.unreadCount;
    });
    setUnreadCounts(counts);
    
    setLoading(false);
  };

  const loadMessages = async (matchId: string) => {
    const supabase = createClient();
    
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const markMessagesAsRead = async (matchId: string) => {
    const supabase = createClient();
    
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("match_id", matchId)
      .neq("sender_id", userId)
      .eq("read", false);

    // Update unread count for this match
    setUnreadCounts(prev => ({ ...prev, [matchId]: 0 }));
    
    // Reload matches to update counts
    loadMatches();
  };

  const subscribeToMessages = (matchId: string) => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          
          // If message is from other user, mark as read immediately since chat is open
          if (payload.new.sender_id !== userId) {
            markMessagesAsRead(matchId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from("messages")
      .insert({
        match_id: selectedMatch.id,
        sender_id: userId,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    }
  };

  const handleSelectMatch = (match: any) => {
    setSelectedMatch(match);
  };

  if (loading) {
    return <div className="text-center py-12">Loading conversations...</div>;
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No conversations yet</p>
          <p className="text-sm text-gray-500 mt-2">Connect with study buddies to start chatting!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => handleSelectMatch(match)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b relative ${
                  selectedMatch?.id === match.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {match.otherUser?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {unreadCounts[match.id] > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{match.otherUser?.full_name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{match.otherUser?.email}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2">
        {selectedMatch ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedMatch.otherUser?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{selectedMatch.otherUser?.full_name || "User"}</CardTitle>
                  <p className="text-xs text-gray-500">{selectedMatch.otherUser?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[500px]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === userId
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_id === userId ? "text-blue-100" : "text-gray-500"}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Select a conversation to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}