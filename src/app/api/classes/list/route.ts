import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("university_id");

    let query = supabase
      .from("class_list")
      .select("class_code, class_name, university_id, class_id")
      .order("class_code", { ascending: true });

    // Filter by university_id if provided
    if (universityId) {
      query = query.eq("university_id", parseInt(universityId));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching classes:", error);
      return NextResponse.json(
        { error: "Failed to fetch classes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ classes: data || [] });
  } catch (error) {
    console.error("Error in classes list API:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

