import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { runMatchCalculation } from "@/lib/runMatchCalculation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: allProfiles } = await supabase
      .from("student_profiles")
      .select("user_id")
      .eq("profile_completed", true);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ message: "No profiles to match" });
    }

    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("matches delete:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to clear matches" },
        { status: 500 }
      );
    }

    for (const profile of allProfiles) {
      const result = await runMatchCalculation(supabase, profile.user_id);
      if (!result.ok && result.code === "upsert_failed") {
        return NextResponse.json(
          { error: result.message || "Failed during recalculation" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated matches for ${allProfiles.length} users`,
    });
  } catch (error) {
    console.error("Error recalculating matches:", error);
    return NextResponse.json({ error: "Failed to recalculate matches" }, { status: 500 });
  }
}
