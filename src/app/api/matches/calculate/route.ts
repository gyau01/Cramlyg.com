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

      // Calculate matching classes
      const matchingClasses = userClassCodes.filter(code => 
        theirClassCodes.includes(code)
      );

      // Calculate major match
      const majorMatch = userProfile.major === profile.major ? 1 : 0;

      // Calculate year match
      const yearMatch = userProfile.year_of_study === profile.year_of_study ? 1 : 0;

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

      // Calculate final compatibility score with weights
      const classWeight = 0.4;
      const majorWeight = 0.2;
      const yearWeight = 0.1;
      const preferenceWeight = 0.3;
      
      const classScore = userClassCodes.length > 0 
        ? (matchingClasses.length / Math.max(userClassCodes.length, theirClassCodes.length)) * 100 
        : 0;
      const majorScore = majorMatch * 100;
      const yearScore = yearMatch * 100;
      const prefScore = totalPreferences > 0 ? (preferenceScore / totalPreferences) * 100 : 0;
      
      const compatibilityScore = 
        (classScore * classWeight) + 
        (majorScore * majorWeight) + 
        (yearScore * yearWeight) + 
        (prefScore * preferenceWeight);

      // Lower threshold to 30% to find more matches
      if (compatibilityScore >= 30) {
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
