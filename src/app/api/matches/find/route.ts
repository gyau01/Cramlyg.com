import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Get current user's profile and classes
    const { data: myProfile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: myClasses } = await supabase
      .from("student_classes")
      .select("class_code")
      .eq("user_id", userId);

    const { data: myPreferences } = await supabase
      .from("study_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const myClassCodes = myClasses?.map(c => c.class_code) || [];

    // Get all other users with completed profiles
    const { data: otherProfiles } = await supabase
      .from("student_profiles")
      .select("*, users!inner(email, name)")
      .eq("profile_completed", true)
      .neq("user_id", userId);

    // Get existing requests and matches to filter out
    const { data: existingRequests } = await supabase
      .from("match_requests")
      .select("receiver_id, sender_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludedIds = new Set([
      ...existingRequests?.map(r => r.sender_id === userId ? r.receiver_id : r.sender_id) || [],
      ...existingMatches?.map(m => m.user1_id === userId ? m.user2_id : m.user1_id) || []
    ]);

    // Calculate compatibility scores
    const matches = await Promise.all(
      otherProfiles
        ?.filter(profile => !excludedIds.has(profile.user_id))
        .map(async (profile) => {
          const { data: theirClasses } = await supabase
            .from("student_classes")
            .select("class_code, class_name")
            .eq("user_id", profile.user_id);

          const { data: theirPreferences } = await supabase
            .from("study_preferences")
            .select("*")
            .eq("user_id", profile.user_id)
            .single();

          const theirClassCodes = theirClasses?.map(c => c.class_code) || [];
          const sharedClasses = myClassCodes.filter(code => theirClassCodes.includes(code));

          // Calculate compatibility score
          let score = 0;

          // Shared classes (40 points max)
          score += Math.min(sharedClasses.length * 20, 40);

          // Same major (20 points)
          if (myProfile?.major === profile.major) score += 20;

          // Similar year (10 points)
          if (myProfile?.year_of_study === profile.year_of_study) score += 10;

          // Matching study preferences (30 points max)
          const timeOverlap = myPreferences?.study_time_preference?.filter(
            (t: string) => theirPreferences?.study_time_preference?.includes(t)
          ).length || 0;
          score += Math.min(timeOverlap * 5, 15);

          const locationOverlap = myPreferences?.study_location_preference?.filter(
            (l: string) => theirPreferences?.study_location_preference?.includes(l)
          ).length || 0;
          score += Math.min(locationOverlap * 5, 15);

          return {
            ...profile,
            email: profile.users?.email,
            name: profile.users?.name,
            shared_classes: sharedClasses,
            compatibility_score: Math.round(score)
          };
        }) || []
    );

    // Sort by compatibility score and return top matches
    const sortedMatches = matches
      .filter(m => m.compatibility_score > 20)
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 20);

    return NextResponse.json({ matches: sortedMatches });
  } catch (error) {
    console.error("Find matches error:", error);
    return NextResponse.json(
      { error: "Failed to find matches" },
      { status: 500 }
    );
  }
}