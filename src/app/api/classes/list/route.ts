import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("university_id");

    // Build query for count
    let countQuery = supabase
      .from("class_list")
      .select("*", { count: 'exact', head: true });
    
    if (universityId) {
      countQuery = countQuery.eq("university_id", parseInt(universityId));
    }
    
    // Get the total count
    const { count } = await countQuery;
    
    // Fetch all classes using pagination (Supabase default limit is 1000)
    const allClasses: any[] = [];
    const pageSize = 1000;
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    for (let page = 0; page < totalPages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      // Build fresh query for each page
      let pageQuery = supabase
        .from("class_list")
        .select("class_code, class_name, university_id, class_id")
        .order("class_code", { ascending: true });
      
      if (universityId) {
        pageQuery = pageQuery.eq("university_id", parseInt(universityId));
      }
      
      const { data, error } = await pageQuery.range(from, to);
      
      if (error) {
        console.error(`Error fetching classes page ${page}:`, error);
        return NextResponse.json(
          { error: "Failed to fetch classes" },
          { status: 500 }
        );
      }
      
      if (data) {
        allClasses.push(...data);
      }
    }

    console.log(`Fetched ${allClasses.length} classes (total available: ${count || 'unknown'})`);
    return NextResponse.json({ classes: allClasses, total: count || allClasses.length });
  } catch (error) {
    console.error("Error in classes list API:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

