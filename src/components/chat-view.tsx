"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Image as ImageIcon, X } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", userId);

    const matchDetails = await Promise.all(
      (matchesData || []).map(async (match) => {
        const otherId = match.user2_id;
        const { data: otherUser } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("user_id", otherId)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id)
          .eq("read", false)
          .neq("sender_id", userId);

        const { data: lastMessage } = await supabase
          .from("messages")
          .select("created_at")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return { 
          ...match, 
          otherUser, 
          otherId, 
          unreadCount: count || 0,
          lastMessageTime: lastMessage?.created_at || match.created_at
        };
      })
    );

    const sortedMatches = matchDetails.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });

    setMatches(sortedMatches);
    
    const counts: Record<string, number> = {};
    sortedMatches.forEach(match => {
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

    setUnreadCounts(prev => ({ ...prev, [matchId]: 0 }));
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
          
          if (payload.new.sender_id !== userId) {
            markMessagesAsRead(matchId);
          }
          
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedMatch) return;

    setUploading(true);
    const supabase = createClient();
    
    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("messages")
      .insert({
        match_id: selectedMatch.id,
        sender_id: userId,
        content: newMessage.trim() || '',
        image_url: imageUrl
      });

    if (!error) {
      setNewMessage("");
      clearImage();
      loadMatches();
    }
    setUploading(false);
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
                        {message.image_url && (
                          <img 
                            src={message.image_url} 
                            alt="Shared image" 
                            className="rounded-lg mb-2 max-w-full h-auto cursor-pointer hover:opacity-90"
                            onClick={() => window.open(message.image_url, '_blank')}
                          />
                        )}
                        {message.content && <p className="text-sm">{message.content}</p>}
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
                {imagePreview && (
                  <div className="mb-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !uploading && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={uploading}
                  />
                  <Button onClick={sendMessage} disabled={(!newMessage.trim() && !selectedImage) || uploading}>
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