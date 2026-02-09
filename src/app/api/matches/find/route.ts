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

    // Get existing matches to filter out
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludedIds = new Set([
      ...existingMatches?.map(m => m.user1_id === userId ? m.user2_id : m.user1_id) || []
    ]);

    // Calculate compatibility scores using 6-factor system
    const matches = await Promise.all(
      (otherProfiles || [])
        .filter(profile => !excludedIds.has(profile.user_id))
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

          // Determine class matching based on user's preference
          let classMatch = false;
          const myClassMatchingPreference = myPreferences?.class_matching_preference || "specific";
          const theirClassMatchingPreference = theirPreferences?.class_matching_preference || "specific";

          if (myClassMatchingPreference === "generic" || theirClassMatchingPreference === "generic") {
            // Generic matching: match by subject area (extract prefix from class codes)
            const extractSubject = (code: string): string => {
              const match = code.match(/^([A-Z]+)/);
              return match ? match[1] : "";
            };

            const mySubjects = new Set(myClassCodes.map(extractSubject).filter(Boolean));
            const theirSubjects = new Set(theirClassCodes.map(extractSubject).filter(Boolean));
            
            // Match if they share any subject area OR same major
            classMatch = Array.from(mySubjects).some(subj => theirSubjects.has(subj)) || 
                         myProfile?.major === profile.major;
          } else {
            // Specific matching: use selected class if available, otherwise match any class
            if (myPreferences?.selected_class_code) {
              // User has selected a specific class - match if the other user has that exact class
              const normalizedSelectedClass = normalizeClassCode(myPreferences.selected_class_code);
              classMatch = theirClassCodes.includes(normalizedSelectedClass);
            } else if (theirPreferences?.selected_class_code) {
              // Other user has selected a specific class - match if current user has that class
              const normalizedSelectedClass = normalizeClassCode(theirPreferences.selected_class_code);
              classMatch = myClassCodes.includes(normalizedSelectedClass);
            } else {
              // No specific class selected, match any common class
              classMatch = myClassCodes.some(code => theirClassCodes.includes(code));
            }
          }

          // Data structure for matching criteria (same as calculate route)
          const matchCriteria = {
            classes: classMatch,
            major: myProfile?.major === profile.major,
            year: myProfile?.year_of_study === profile.year_of_study,
            studyTime: (myPreferences?.study_time_preference || []).some((time: string) =>
          (theirPreferences?.study_time_preference || []).includes(time)
        ),
        location: (myPreferences?.study_location_preference || []).some((loc: string) =>
          (theirPreferences?.study_location_preference || []).includes(loc)
        ),
        style: (myPreferences?.study_style || []).some((style: string) =>
          (theirPreferences?.study_style || []).includes(style)
        )
          };

          // Count matching factors
          const matchingFactors = Object.values(matchCriteria).filter(Boolean).length;
          const totalFactors = Object.keys(matchCriteria).length;
          const compatibilityScore = (matchingFactors / totalFactors) * 100;

          // Calculate shared classes based on matching preference
          let sharedClasses: string[] = [];
          if (myClassMatchingPreference === "generic" || theirClassMatchingPreference === "generic") {
            // For generic matching, show shared subject areas
            const extractSubject = (code: string): string => {
              const match = normalizeClassCode(code).match(/^([A-Z]+)/);
              return match ? match[1] : "";
            };
            const mySubjects = new Set(myClassCodes.map(extractSubject).filter(Boolean));
            const theirSubjects = new Set(theirClassCodes.map(extractSubject).filter(Boolean));
            sharedClasses = Array.from(mySubjects).filter(subj => theirSubjects.has(subj));
          } else {
            // For specific matching, show exact class matches
            sharedClasses = myClasses?.filter(myClass => 
              theirClasses?.some(theirClass => 
                normalizeClassCode(myClass.class_code) === normalizeClassCode(theirClass.class_code)
              )
            ).map(c => c.class_code) || [];
          }

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
