import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId, compatibilityScore } = await request.json();

    if (!otherUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if match already exists (check both directions)
    const { data: existingMatch1 } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", user.id)
      .eq("user2_id", otherUserId)
      .maybeSingle();

    const { data: existingMatch2 } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", otherUserId)
      .eq("user2_id", user.id)
      .maybeSingle();

    if (existingMatch1 || existingMatch2) {
      return NextResponse.json({ 
        success: true, 
        message: "Already connected with this user" 
      });
    }

    // Create bidirectional matches (both directions)
    const matchesToInsert = [
      {
        user1_id: user.id,
        user2_id: otherUserId,
        compatibility_score: compatibilityScore || 0
      },
      {
        user1_id: otherUserId,
        user2_id: user.id,
        compatibility_score: compatibilityScore || 0
      }
    ];

    const { error } = await supabase
      .from("matches")
      .insert(matchesToInsert);

    if (error) {
      console.error("Create match error:", error);
      return NextResponse.json(
        { error: "Failed to create match" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect" },
      { status: 500 }
    );
  }
}

