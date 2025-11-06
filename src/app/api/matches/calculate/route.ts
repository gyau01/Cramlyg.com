import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile, classes, and preferences
    const { data: userProfile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: userClasses } = await supabase
      .from("student_classes")
      .select("class_code")
      .eq("user_id", userId);

    const { data: userPreferences } = await supabase
      .from("study_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!userProfile || !userClasses || !userPreferences) {
      return NextResponse.json({ error: "Profile incomplete" }, { status: 400 });
    }

    const userClassCodes = userClasses.map(c => c.class_code);

    // Get all other completed profiles
    const { data: allProfiles } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("profile_completed", true)
      .neq("user_id", userId);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const matches = [];

    for (const profile of allProfiles) {
      // Get their classes and preferences
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

      // Simple 6-factor scoring system
      let matchingFactors = 0;
      const totalFactors = 6;

      // 1. Classes match (any shared class = match)
      const hasSharedClass = userClassCodes.some(code => theirClassCodes.includes(code));
      if (hasSharedClass) matchingFactors++;

      // 2. Major match
      if (userProfile.major === profile.major) matchingFactors++;

      // 3. Year match
      if (userProfile.year_of_study === profile.year_of_study) matchingFactors++;

      // 4. Study time preference match (any overlap = match)
      const userTimes = userPreferences.study_time_preference || [];
      const theirTimes = theirPreferences.study_time_preference || [];
      const hasSharedTime = userTimes.some(time => theirTimes.includes(time));
      if (hasSharedTime) matchingFactors++;

      // 5. Study location preference match (any overlap = match)
      const userLocs = userPreferences.study_location_preference || [];
      const theirLocs = theirPreferences.study_location_preference || [];
      const hasSharedLocation = userLocs.some(loc => theirLocs.includes(loc));
      if (hasSharedLocation) matchingFactors++;

      // 6. Study style match (any overlap = match)
      const userStyles = userPreferences.study_style || [];
      const theirStyles = theirPreferences.study_style || [];
      const hasSharedStyle = userStyles.some(style => theirStyles.includes(style));
      if (hasSharedStyle) matchingFactors++;

      // Calculate compatibility score
      const compatibilityScore = (matchingFactors / totalFactors) * 100;

      // Only create match if at least 1 factor matches
      if (matchingFactors >= 1) {
        matches.push({
          user1_id: userId,
          user2_id: profile.user_id,
          compatibility_score: Math.round(compatibilityScore * 100) / 100
        });
        
        // Bidirectional match
        matches.push({
          user1_id: profile.user_id,
          user2_id: userId,
          compatibility_score: Math.round(compatibilityScore * 100) / 100
        });
      }
    }

    // Save matches to database
    if (matches.length > 0) {
      await supabase.from("matches").upsert(matches, {
        onConflict: "user1_id,user2_id"
      });
    }

    return NextResponse.json({ 
      success: true, 
      matchCount: matches.length / 2 
    });

  } catch (error) {
    console.error("Error calculating matches:", error);
    return NextResponse.json({ error: "Failed to calculate matches" }, { status: 500 });
  }
}