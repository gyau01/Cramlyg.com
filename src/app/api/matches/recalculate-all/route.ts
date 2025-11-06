import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all completed profiles
    const { data: allProfiles } = await supabase
      .from("student_profiles")
      .select("user_id")
      .eq("profile_completed", true);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ message: "No profiles to match" });
    }

    // Clear existing matches
    await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Recalculate matches for each user
    for (const profile of allProfiles) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'canvases.tempo.build')}/api/matches/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.user_id })
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Recalculated matches for ${allProfiles.length} users` 
    });

  } catch (error) {
    console.error("Error recalculating matches:", error);
    return NextResponse.json({ error: "Failed to recalculate matches" }, { status: 500 });
  }
}
