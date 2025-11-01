"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageCircle, UserCircle } from "lucide-react";
import FindBuddies from "./find-buddies";
import MatchesView from "./matches-view";
import ChatView from "./chat-view";
import ProfileView from "./profile-view";

interface DashboardContentProps {
  userId: string;
}

export default function DashboardContent({ userId }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "find");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleStartChat = (match: any) => {
    setSelectedMatch(match);
    setActiveTab("chat");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="find" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Find Buddies
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find">
          <FindBuddies userId={userId} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesView userId={userId} onStartChat={handleStartChat} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatView userId={userId} initialMatch={selectedMatch} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}