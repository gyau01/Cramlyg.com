"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageCircle, BookOpen, GraduationCap } from "lucide-react";
import { createClient } from "../../supabase/client";

interface MatchesViewProps {
  userId: string;
  onStartChat?: (match: any) => void;
}

export default function MatchesView({ userId, onStartChat }: MatchesViewProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel('match_updates')
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

    const { data: matchesRes } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", userId)
      .order("compatibility_score", { ascending: false });

    // Get match details with user info
    const matchDetails = await Promise.all(
      (matchesRes || []).map(async (match) => {
        const otherId = match.user2_id;
        
        const { data: otherUser } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("user_id", otherId)
          .single();
        
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("major, year_of_study")
          .eq("user_id", otherId)
          .single();

        const { data: classes } = await supabase
          .from("student_classes")
          .select("class_code, class_name")
          .eq("user_id", otherId)
          .limit(3);

        return { ...match, otherUser, profile, classes, otherId };
      })
    );

    setMatches(matchDetails);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading your study buddies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Study Buddies</h2>
          <p className="text-gray-600">Found {matches.length} compatible students</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No matches yet</p>
            <p className="text-sm text-gray-500">Complete your profile to find study buddies</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                      {match.otherUser?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{match.otherUser?.full_name || "User"}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600 truncate">{match.profile?.major || "Student"}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{match.profile?.year_of_study}</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shrink-0">
                    {Math.round(match.compatibility_score)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {match.classes && match.classes.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Classes:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.classes.map((cls: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cls.class_code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                  onClick={() => onStartChat?.(match)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}