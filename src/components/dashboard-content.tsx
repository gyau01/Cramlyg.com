"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, MessageSquare, Search } from "lucide-react";
import ProfileView from "./profile-view";
import FindBuddies from "./find-buddies";
import MatchesView from "./matches-view";
import ChatView from "./chat-view";

interface DashboardContentProps {
  userId: string;
}

export default function DashboardContent({ userId }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Buddy Dashboard</h1>
        <p className="text-gray-600">Find your perfect study partner</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="find" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Find Buddies</span>
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Matches</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileView userId={userId} />
        </TabsContent>

        <TabsContent value="find">
          <FindBuddies userId={userId} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesView userId={userId} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatView userId={userId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}