import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import FindingMatchesClient from "@/components/finding-matches-client";

export default async function FindingMatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <FindingMatchesClient userId={user.id} />;
}
