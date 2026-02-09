import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SCORING, applyScore } from "@/lib/matchScoring";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Normalize class codes
function normalizeClassCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const userClassCodes = userClasses.map(c =>
      normalizeClassCode(c.class_code)
    );

    const { data: allProfiles } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("profile_completed", true)
      .neq("user_id", userId);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ success: true, matchCount: 0 });
    }

    const matches: any[] = [];

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

      const theirClassCodes = theirClasses.map(c =>
        normalizeClassCode(c.class_code)
      );

      // ----- CLASS MATCHING LOGIC (unchanged) -----
      let classMatch = false;
      const userPref = userPreferences.class_matching_preference || "specific";
      const theirPref = theirPreferences.class_matching_preference || "specific";

      if (userPref === "generic" || theirPref === "generic") {
        const extractSubject = (code: string) =>
          code.match(/^([A-Z]+)/)?.[1] || "";

        const userSubjects = new Set(userClassCodes.map(extractSubject));
        const theirSubjects = new Set(theirClassCodes.map(extractSubject));

        classMatch =
          Array.from(userSubjects).some(s => theirSubjects.has(s)) ||
          userProfile.major === profile.major;
      } else {
        if (userPreferences.selected_class_code) {
          classMatch = theirClassCodes.includes(
            normalizeClassCode(userPreferences.selected_class_code)
          );
        } else if (theirPreferences.selected_class_code) {
          classMatch = userClassCodes.includes(
            normalizeClassCode(theirPreferences.selected_class_code)
          );
        } else {
          classMatch = userClassCodes.some(c =>
            theirClassCodes.includes(c)
          );
        }
      }

      const matchCriteria = {
        classes: classMatch,
        major: userProfile.major === profile.major,
        year: userProfile.year_of_study === profile.year_of_study,
        studyTime: (userPreferences.study_time_preference || []).some(
          (t: string) =>
            (theirPreferences.study_time_preference || []).includes(t)
        ),
        location: (userPreferences.study_location_preference || []).some(
          (l: string) =>
            (theirPreferences.study_location_preference || []).includes(l)
        ),
        style: (userPreferences.study_style || []).some(
          (s: string) =>
            (theirPreferences.study_style || []).includes(s)
        )
      };

      let scoreTotal = 0;

      scoreTotal += applyScore(
        matchCriteria.classes,
        SCORING.classes.points,
        SCORING.classes.weight,
        userPreferences.class_priority
      );

      scoreTotal += applyScore(
        matchCriteria.major,
        SCORING.major.points,
        SCORING.major.weight,
        userPreferences.major_priority
      );

      scoreTotal += applyScore(
        matchCriteria.year,
        SCORING.year.points,
        SCORING.year.weight,
        userPreferences.year_priority
      );

      scoreTotal += applyScore(
        matchCriteria.studyTime,
        SCORING.studyTime.points,
        SCORING.studyTime.weight,
        userPreferences.time_priority
      );

      scoreTotal += applyScore(
        matchCriteria.location,
        SCORING.location.points,
        SCORING.location.weight,
        userPreferences.location_priority
      );

      scoreTotal += applyScore(
        matchCriteria.style,
        SCORING.style.points,
        SCORING.style.weight,
        userPreferences.style_priority
      );

      if (scoreTotal >= SCORING.minTotal) {
        matches.push(
          {
            user1_id: userId,
            user2_id: profile.user_id,
            compatibility_score: Math.round(scoreTotal)
          },
          {
            user1_id: profile.user_id,
            user2_id: userId,
            compatibility_score: Math.round(scoreTotal)
          }
        );
      }
    }

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
    return NextResponse.json(
      { error: "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
