import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profile, classes, preferences } = await request.json();

    // Insert student profile
    const { error: profileError } = await supabase
      .from("student_profiles")
      .upsert({
        user_id: user.id,
        university: profile.university,
        major: profile.major,
        year_of_study: profile.yearOfStudy,
        gpa: profile.gpa || null,
        bio: profile.bio,
        profile_completed: true,
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // Delete existing classes and insert new ones
    await supabase.from("student_classes").delete().eq("user_id", user.id);

    if (classes && classes.length > 0) {
      const classesData = classes.map((cls: any) => ({
        user_id: user.id,
        class_code: cls.code,
        class_name: cls.name,
        semester: cls.semester
      }));

      const { error: classesError } = await supabase
        .from("student_classes")
        .insert(classesData);

      if (classesError) throw classesError;
    }

    // Insert study preferences
    const preferencesData: any = {
      user_id: user.id,
      study_time_preference: preferences.studyTimes,
      study_location_preference: preferences.studyLocations,
      group_size_preference: preferences.groupSize,
      study_style: preferences.studyStyles,
      class_matching_preference: preferences.classMatchingPreference || "specific",
      updated_at: new Date().toISOString()
    };
    
    // Only include selected_class_code if specific matching is selected
    if (preferences.classMatchingPreference === "specific" && preferences.selectedClassCode) {
      preferencesData.selected_class_code = preferences.selectedClassCode;
    } else {
      preferencesData.selected_class_code = null;
    }
    
    const { error: preferencesError } = await supabase
      .from("study_preferences")
      .upsert(preferencesData);

    if (preferencesError) throw preferencesError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}