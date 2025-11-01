"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, CheckCircle } from "lucide-react";

interface FindingMatchesClientProps {
  userId: string;
}

export default function FindingMatchesClient({ userId }: FindingMatchesClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState("Analyzing your profile...");

  useEffect(() => {
    const findMatches = async () => {
      try {
        setStatus("Loading your classes and preferences...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus("Searching for students with similar profiles...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus("Calculating compatibility scores...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Call the API to calculate matches
        const response = await fetch("/api/matches/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });

        const data = await response.json();

        setStatus("Saving your matches...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus("Complete! Redirecting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/dashboard?tab=matches");

      } catch (error) {
        console.error("Error finding matches:", error);
        router.push("/dashboard?tab=matches");
      }
    };

    findMatches();
  }, [userId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Finding Your Study Buddies</CardTitle>
          <CardDescription>
            We're analyzing your profile to find the best matches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-600">Profile analyzed</p>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-600">Searching for compatible students</p>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-600">Calculating compatibility scores</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-center text-sm font-medium text-blue-600">{status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}