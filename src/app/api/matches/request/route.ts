import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, message } = await request.json();

    const { error } = await supabase
      .from("match_requests")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message: message || null,
        status: "pending"
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send request error:", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (action === "accept") {
      // Get the request details
      const { data: matchRequest } = await supabase
        .from("match_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!matchRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      // Update request status
      await supabase
        .from("match_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      // Create match
      await supabase
        .from("matches")
        .insert({
          user1_id: matchRequest.sender_id,
          user2_id: matchRequest.receiver_id,
          compatibility_score: 0
        });
    } else if (action === "decline") {
      await supabase
        .from("match_requests")
        .update({ status: "declined" })
        .eq("id", requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}