import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../../../supabase/server";
import { runMatchCalculation } from "@/lib/runMatchCalculation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
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

    const { userId } = await request.json();

    const authClient = await createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const result = await runMatchCalculation(supabase, userId);

    if (!result.ok) {
      if (result.code === "incomplete_profile") {
        return NextResponse.json({ error: "Profile incomplete" }, { status: 400 });
      }
      return NextResponse.json(
        { error: result.message || "Failed to save matches" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matchCount: result.matchCount,
    });
  } catch (error) {
    console.error("Error calculating matches:", error);
    return NextResponse.json(
      { error: "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
