import { createClient as createServerClient } from "../../../../../supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 }
    );
  }

  const authClient = await createServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceKey);
  const uid = user.id;

  const { data: matchesRes, error: matchesError } = await admin
    .from("matches")
    .select("*")
    .eq("user1_id", uid)
    .order("compatibility_score", { ascending: false });

  if (matchesError) {
    console.error("matches/me:", matchesError);
    return NextResponse.json(
      { error: matchesError.message || "Failed to load matches" },
      { status: 500 }
    );
  }

  const matchDetails = await Promise.all(
    (matchesRes || []).map(async (match) => {
      const otherId = match.user2_id;
      const [otherUserRes, profileRes, classesRes] = await Promise.all([
        admin.from("users").select("full_name, email").eq("user_id", otherId).single(),
        admin
          .from("student_profiles")
          .select("major, year_of_study")
          .eq("user_id", otherId)
          .single(),
        admin
          .from("student_classes")
          .select("class_code, class_name")
          .eq("user_id", otherId)
          .limit(3),
      ]);

      return {
        ...match,
        otherUser: otherUserRes.data ?? null,
        profile: profileRes.data ?? null,
        classes: classesRes.data ?? [],
        otherId,
      };
    })
  );

  return NextResponse.json({ matches: matchDetails });
}
