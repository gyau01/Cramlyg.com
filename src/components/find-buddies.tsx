"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, TrendingUp, Send, Loader2 } from "lucide-react";
import { createClient } from "../../supabase/client";

interface FindBuddiesProps {
  userId: string;
}

export default function FindBuddies({ userId }: FindBuddiesProps) {
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    loadPotentialMatches();
  }, [userId]);

  const loadPotentialMatches = async () => {
    try {
      const response = await fetch(`/api/matches/find?userId=${userId}`);
      const data = await response.json();
      
      // Ensure we have full_name for each match
      const supabase = createClient();
      const matchesWithNames = await Promise.all(
        (data.matches || []).map(async (match: any) => {
          const { data: userData } = await supabase
            .from("users")
            .select("full_name")
            .eq("user_id", match.user_id)
            .single();
          
          return {
            ...match,
            full_name: userData?.full_name || match.name || match.email?.split('@')[0]
          };
        })
      );
      
      setPotentialMatches(matchesWithNames);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMatchRequest = async (receiverId: string) => {
    setSendingRequest(receiverId);
    try {
      const response = await fetch("/api/matches/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          message: requestMessage
        })
      });

      if (response.ok) {
        setPotentialMatches(potentialMatches.filter(m => m.user_id !== receiverId));
        setRequestMessage("");
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setSendingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Find Your Study Buddy
          </CardTitle>
          <CardDescription>
            We've found {potentialMatches.length} potential study partners based on your profile
          </CardDescription>
        </CardHeader>
      </Card>

      {potentialMatches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No potential matches found at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later or update your profile!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {potentialMatches.map((match) => (
            <Card key={match.user_id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {match.full_name?.[0]?.toUpperCase() || match.email?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{match.full_name || match.email?.split('@')[0] || "Student"}</CardTitle>
                    <p className="text-sm text-gray-500">{match.major}</p>
                    <Badge variant="secondary" className="mt-2">
                      {match.year_of_study}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      {match.compatibility_score}%
                    </div>
                    <p className="text-xs text-gray-500">Match</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {match.bio && (
                  <p className="text-sm text-gray-700 line-clamp-2">{match.bio}</p>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Shared Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {match.shared_classes?.slice(0, 3).map((cls: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 border-blue-200">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {cls}
                      </Badge>
                    ))}
                    {match.shared_classes?.length > 3 && (
                      <Badge variant="outline">+{match.shared_classes.length - 3} more</Badge>
                    )}
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedUser(match)}
                      disabled={sendingRequest === match.user_id}
                    >
                      {sendingRequest === match.user_id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Connection Request
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Connection Request</DialogTitle>
                      <DialogDescription>
                        Send a message to {match.full_name || "this student"} to introduce yourself
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                          id="message"
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="Hi! I noticed we're taking similar classes. Would you like to study together?"
                          rows={4}
                        />
                      </div>
                      <Button 
                        onClick={() => sendMatchRequest(match.user_id)} 
                        className="w-full"
                        disabled={sendingRequest === match.user_id}
                      >
                        {sendingRequest === match.user_id ? "Sending..." : "Send Request"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}