import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

// Normalize class codes for comparison (remove spaces, convert to uppercase)
function normalizeClassCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

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

    const myClassCodes = myClasses?.map(c => normalizeClassCode(c.class_code)) || [];

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

    // Calculate compatibility scores using 6-factor system
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

          const theirClassCodes = theirClasses?.map(c => normalizeClassCode(c.class_code)) || [];

          // Data structure for matching criteria (same as calculate route)
          const matchCriteria = {
            classes: myClassCodes.some(code => theirClassCodes.includes(code)),
            major: myProfile?.major === profile.major,
            year: myProfile?.year_of_study === profile.year_of_study,
            studyTime: (myPreferences?.study_time_preference || []).some(time => 
              (theirPreferences?.study_time_preference || []).includes(time)
            ),
            location: (myPreferences?.study_location_preference || []).some(loc => 
              (theirPreferences?.study_location_preference || []).includes(loc)
            ),
            style: (myPreferences?.study_style || []).some(style => 
              (theirPreferences?.study_style || []).includes(style)
            )
          };

          // Count matching factors
          const matchingFactors = Object.values(matchCriteria).filter(Boolean).length;
          const totalFactors = Object.keys(matchCriteria).length;
          const compatibilityScore = (matchingFactors / totalFactors) * 100;

          const sharedClasses = myClasses?.filter(myClass => 
            theirClasses?.some(theirClass => 
              normalizeClassCode(myClass.class_code) === normalizeClassCode(theirClass.class_code)
            )
          ).map(c => c.class_code) || [];

          return {
            ...profile,
            email: profile.users?.email,
            name: profile.users?.name,
            shared_classes: sharedClasses,
            compatibility_score: Math.round(compatibilityScore * 100) / 100
          };
        }) || []
    );

    // Sort by compatibility score and return matches with at least 1 matching factor
    const sortedMatches = matches
      .filter(m => m.compatibility_score > 0)
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