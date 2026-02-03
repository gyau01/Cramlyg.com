import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert into waitlist
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === "23505" || error.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "This email is already on the waitlist" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Successfully added to waitlist!", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}

