"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, BookOpen, Target } from "lucide-react";
import { createClient } from "../../supabase/client";

interface FindingMatchesClientProps {
  userId: string;
}

export default function FindingMatchesClient({ userId }: FindingMatchesClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState("Analyzing your profile...");
  const supabase = createClient();

  useEffect(() => {
    const findMatches = async () => {
      try {
        // Step 1: Get user's classes and preferences
        setStatus("Loading your classes and preferences...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { data: userClasses } = await supabase
          .from("student_classes")
          .select("class_code")
          .eq("user_id", userId);

        const { data: userPreferences } = await supabase
          .from("study_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!userClasses || !userPreferences) {
          router.push("/dashboard");
          return;
        }

        const userClassCodes = userClasses.map(c => c.class_code);

        // Step 2: Find potential matches
        setStatus("Searching for students with similar classes...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { data: allProfiles } = await supabase
          .from("student_profiles")
          .select("user_id")
          .eq("profile_completed", true)
          .neq("user_id", userId);

        if (!allProfiles) {
          router.push("/dashboard");
          return;
        }

        // Step 3: Calculate compatibility scores
        setStatus("Calculating compatibility scores...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        const matches = [];

        for (const profile of allProfiles) {
          const { data: theirClasses } = await supabase
            .from("student_classes")
            .select("class_code")
            .eq("user_id", profile.user_id);

          const { data: theirPreferences } = await supabase
            .from("study_preferences")
            .select("*")
            .eq("user_id", profile.user_id)
            .single();

          if (!theirClasses || !theirPreferences) continue;

          const theirClassCodes = theirClasses.map(c => c.class_code);

          // Calculate matching classes
          const matchingClasses = userClassCodes.filter(code => 
            theirClassCodes.includes(code)
          );

          if (matchingClasses.length === 0) continue;

          // Calculate preference similarity
          let preferenceScore = 0;
          let totalPreferences = 0;

          // Study time preference
          if (userPreferences.study_time_preference && theirPreferences.study_time_preference) {
            const matchingTimes = userPreferences.study_time_preference.filter(time =>
              theirPreferences.study_time_preference.includes(time)
            );
            preferenceScore += matchingTimes.length;
            totalPreferences += Math.max(
              userPreferences.study_time_preference.length,
              theirPreferences.study_time_preference.length
            );
          }

          // Study location preference
          if (userPreferences.study_location_preference && theirPreferences.study_location_preference) {
            const matchingLocations = userPreferences.study_location_preference.filter(loc =>
              theirPreferences.study_location_preference.includes(loc)
            );
            preferenceScore += matchingLocations.length;
            totalPreferences += Math.max(
              userPreferences.study_location_preference.length,
              theirPreferences.study_location_preference.length
            );
          }

          // Group size preference
          if (userPreferences.group_size_preference === theirPreferences.group_size_preference) {
            preferenceScore += 1;
          }
          totalPreferences += 1;

          // Study style preference
          if (userPreferences.study_style && theirPreferences.study_style) {
            const matchingStyles = userPreferences.study_style.filter(style =>
              theirPreferences.study_style.includes(style)
            );
            preferenceScore += matchingStyles.length;
            totalPreferences += Math.max(
              userPreferences.study_style.length,
              theirPreferences.study_style.length
            );
          }

          // Calculate final compatibility score (0-100)
          const classWeight = 0.6;
          const preferenceWeight = 0.4;
          
          const classScore = (matchingClasses.length / Math.max(userClassCodes.length, theirClassCodes.length)) * 100;
          const prefScore = totalPreferences > 0 ? (preferenceScore / totalPreferences) * 100 : 0;
          
          const compatibilityScore = (classScore * classWeight) + (prefScore * preferenceWeight);

          if (compatibilityScore >= 70) {
            matches.push({
              user1_id: userId,
              user2_id: profile.user_id,
              compatibility_score: Math.round(compatibilityScore * 100) / 100
            });
          }
        }

        // Step 4: Save matches to database
        setStatus("Saving your matches...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (matches.length > 0) {
          await supabase.from("matches").upsert(matches, {
            onConflict: "user1_id,user2_id"
          });
        }

        // Step 5: Redirect to dashboard
        setStatus("Complete! Redirecting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/dashboard");

      } catch (error) {
        console.error("Error finding matches:", error);
        router.push("/dashboard");
      }
    };

    findMatches();
  }, [userId, router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Users className="h-20 w-20 text-blue-400 opacity-75" />
              </div>
              <Users className="h-20 w-20 text-blue-600 relative" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Finding Your Study Buddies</h2>
              <p className="text-gray-600">{status}</p>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Matching Classes</p>
                  <p className="text-xs text-gray-600">Finding students in your courses</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Study Preferences</p>
                  <p className="text-xs text-gray-600">Comparing study styles and times</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Compatibility Score</p>
                  <p className="text-xs text-gray-600">Calculating best matches</p>
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "75%" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}