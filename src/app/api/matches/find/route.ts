import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";
import { SCORING, applyScore } from "@/lib/matchScoring";

function normalizeClassCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
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

    const myClassCodes =
      myClasses?.map(c => normalizeClassCode(c.class_code)) || [];

    const { data: otherProfiles } = await supabase
      .from("student_profiles")
      .select("*, users!inner(email, name)")
      .eq("profile_completed", true)
      .neq("user_id", userId);

    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludedIds = new Set(
      existingMatches?.map(m =>
        m.user1_id === userId ? m.user2_id : m.user1_id
      ) || []
    );

    const matches = await Promise.all(
      (otherProfiles || [])
        .filter(p => !excludedIds.has(p.user_id))
        .map(async profile => {
          const { data: theirClasses } = await supabase
            .from("student_classes")
            .select("class_code")
            .eq("user_id", profile.user_id);

          const { data: theirPreferences } = await supabase
            .from("study_preferences")
            .select("*")
            .eq("user_id", profile.user_id)
            .single();

          const theirClassCodes =
            theirClasses?.map(c =>
              normalizeClassCode(c.class_code)
            ) || [];

          let classMatch = false;
          const myPref = myPreferences?.class_matching_preference || "specific";
          const theirPref =
            theirPreferences?.class_matching_preference || "specific";

          if (myPref === "generic" || theirPref === "generic") {
            const extract = (c: string) => c.match(/^([A-Z]+)/)?.[1] || "";
            const mySub = new Set(myClassCodes.map(extract));
            const theirSub = new Set(theirClassCodes.map(extract));

            classMatch =
              Array.from(mySub).some(s => theirSub.has(s)) ||
              myProfile?.major === profile.major;
          } else {
            classMatch = myClassCodes.some(c =>
              theirClassCodes.includes(c)
            );
          }

          const matchCriteria = {
            classes: classMatch,
            major: myProfile?.major === profile.major,
            year: myProfile?.year_of_study === profile.year_of_study,
            studyTime: (myPreferences?.study_time_preference || []).some(
              (t: string) => theirPreferences?.study_time_preference?.includes(t)
            ),
            location: (myPreferences?.study_location_preference || []).some(
              (l: string) => theirPreferences?.study_location_preference?.includes(l)
            ),
            style: (myPreferences?.study_style || []).some(
              (s: string) => theirPreferences?.study_style?.includes(s)
            )
          };

          let scoreTotal = 0;

          scoreTotal += applyScore(
            matchCriteria.classes,
            SCORING.classes.points,
            SCORING.classes.weight,
            myPreferences?.class_priority
          );

          scoreTotal += applyScore(
            matchCriteria.major,
            SCORING.major.points,
            SCORING.major.weight,
            myPreferences?.major_priority
          );

          scoreTotal += applyScore(
            matchCriteria.year,
            SCORING.year.points,
            SCORING.year.weight,
            myPreferences?.year_priority
          );

          scoreTotal += applyScore(
            matchCriteria.studyTime,
            SCORING.studyTime.points,
            SCORING.studyTime.weight,
            myPreferences?.time_priority
          );

          scoreTotal += applyScore(
            matchCriteria.location,
            SCORING.location.points,
            SCORING.location.weight,
            myPreferences?.location_priority
          );

          scoreTotal += applyScore(
            matchCriteria.style,
            SCORING.style.points,
            SCORING.style.weight,
            myPreferences?.style_priority
          );

          return {
            ...profile,
            email: profile.users?.email,
            name: profile.users?.name,
            compatibility_score: Math.round(scoreTotal)
          };
        })
    );

    const sortedMatches = matches
      .filter(m => m.compatibility_score >= SCORING.minTotal)
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
