"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Users, MessageCircle } from "lucide-react";
import { createClient } from "../../supabase/client";

interface MatchesViewProps {
  userId: string;
}

export default function MatchesView({ userId }: MatchesViewProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel('match_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_requests' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadData = async () => {
    const supabase = createClient();

    const [pendingRes, sentRes, matchesRes] = await Promise.all([
      supabase
        .from("match_requests")
        .select("*, sender:users!match_requests_sender_id_fkey(name, email)")
        .eq("receiver_id", userId)
        .eq("status", "pending"),
      supabase
        .from("match_requests")
        .select("*, receiver:users!match_requests_receiver_id_fkey(name, email)")
        .eq("sender_id", userId),
      supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    ]);

    setPendingRequests(pendingRes.data || []);
    setSentRequests(sentRes.data || []);

    // Get match details
    const matchDetails = await Promise.all(
      (matchesRes.data || []).map(async (match) => {
        const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const { data: otherUser } = await supabase
          .from("users")
          .select("name, email")
          .eq("user_id", otherId)
          .single();
        
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("major, year_of_study")
          .eq("user_id", otherId)
          .single();

        return { ...match, otherUser, profile, otherId };
      })
    );

    setMatches(matchDetails);
    setLoading(false);
  };

  const handleRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      await fetch("/api/matches/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      loadData();
    } catch (error) {
      console.error("Error handling request:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <Tabs defaultValue="matches" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="matches">
          My Matches ({matches.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pendingRequests.length})
        </TabsTrigger>
        <TabsTrigger value="sent">
          Sent ({sentRequests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="matches" className="space-y-4 mt-6">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-600 text-white">
                        {match.otherUser?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{match.otherUser?.name || "Anonymous"}</CardTitle>
                      <p className="text-sm text-gray-500">{match.profile?.major}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pending" className="space-y-4 mt-6">
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {request.sender?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{request.sender?.name || "Anonymous"}</CardTitle>
                      <p className="text-sm text-gray-500">{request.sender?.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(request.id, "accept")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, "decline")}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-4 mt-6">
        {sentRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sent requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((request) => (
              <Card key={request.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-600 text-white">
                        {request.receiver?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{request.receiver?.name || "Anonymous"}</CardTitle>
                      <p className="text-sm text-gray-500">{request.receiver?.email}</p>
                    </div>
                    <Badge variant={request.status === "pending" ? "secondary" : request.status === "accepted" ? "default" : "destructive"}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}