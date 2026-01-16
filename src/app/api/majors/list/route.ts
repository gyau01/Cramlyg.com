import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("university_id");

    let query = supabase
      .from("majors")
      .select("id, major_name, major_code")
      .order("major_name", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching majors:", error);
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: "Majors table not found. Please run the database migration.", details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch majors", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ majors: data || [] });
  } catch (error) {
    console.error("Error in majors list API:", error);
    return NextResponse.json(
      { error: "Failed to fetch majors" },
      { status: 500 }
    );
  }
}

