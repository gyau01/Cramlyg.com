import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Normalize class codes for comparison (remove spaces, convert to uppercase)
function normalizeClassCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
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

    const userClassCodes = userClasses.map(c => normalizeClassCode(c.class_code));

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

      const theirClassCodes = theirClasses.map(c => normalizeClassCode(c.class_code));

      // Determine class matching based on user's preference
      let classMatch = false;
      const userClassMatchingPreference = userPreferences.class_matching_preference || "specific";
      const theirClassMatchingPreference = theirPreferences.class_matching_preference || "specific";

      if (userClassMatchingPreference === "generic" || theirClassMatchingPreference === "generic") {
        // Generic matching: match by subject area (extract prefix from class codes)
        // e.g., "CS101" -> "CS", "MATH201" -> "MATH"
        const extractSubject = (code: string): string => {
          // Extract letters at the start (subject prefix)
          const match = code.match(/^([A-Z]+)/);
          return match ? match[1] : "";
        };

        const userSubjects = new Set(userClassCodes.map(extractSubject).filter(Boolean));
        const theirSubjects = new Set(theirClassCodes.map(extractSubject).filter(Boolean));
        
        // Match if they share any subject area OR same major
        classMatch = Array.from(userSubjects).some(subj => theirSubjects.has(subj)) || 
                     userProfile.major === profile.major;
      } else {
        // Specific matching: use selected class if available, otherwise match any class
        if (userPreferences.selected_class_code) {
          // User has selected a specific class - match if the other user has that exact class
          const normalizedSelectedClass = normalizeClassCode(userPreferences.selected_class_code);
          classMatch = theirClassCodes.includes(normalizedSelectedClass);
        } else if (theirPreferences.selected_class_code) {
          // Other user has selected a specific class - match if current user has that class
          const normalizedSelectedClass = normalizeClassCode(theirPreferences.selected_class_code);
          classMatch = userClassCodes.includes(normalizedSelectedClass);
        } else {
          // No specific class selected, match any common class
          classMatch = userClassCodes.some(code => theirClassCodes.includes(code));
        }
      }

      // Data structure for matching criteria
      const matchCriteria = {
        classes: classMatch,
        major: userProfile.major === profile.major,
        year: userProfile.year_of_study === profile.year_of_study,
          studyTime: (userPreferences.study_time_preference || []).some((time: string) =>
          (theirPreferences.study_time_preference || []).includes(time)
        ),
        location: (userPreferences.study_location_preference || []).some((loc: string) => 
          (theirPreferences.study_location_preference || []).includes(loc)
        ),
        style: (userPreferences.study_style || []).some((style: string) => 
          (theirPreferences.study_style || []).includes(style)
        )
      };

      // Count matching factors
      const matchingFactors = Object.values(matchCriteria).filter(Boolean).length;
      const totalFactors = Object.keys(matchCriteria).length;
      const compatibilityScore = (matchingFactors / totalFactors) * 100;

      // Create match if at least 1 factor matches
      if (matchingFactors >= 1) {
        matches.push({
          user1_id: userId,
          user2_id: profile.user_id,
          compatibility_score: Math.round(compatibilityScore * 100) / 100
        });
        
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
