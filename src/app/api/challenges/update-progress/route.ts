import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentTotal } = await req.json();

  // Get all active challenges for this user
  const { data: challenges, error: challengesError } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .eq("status", "active");

  if (challengesError) {
    return NextResponse.json({ error: challengesError.message }, { status: 500 });
  }

  // Update progress for each active challenge
  for (const challenge of challenges || []) {
    const isChallenger = challenge.challenger_id === userId;
    const startTotal = isChallenger ? challenge.challenger_start_total || 0 : challenge.challenged_start_total || 0;
    const progress = Math.max(0, currentTotal - startTotal);

    const updateField = isChallenger ? "challenger_progress" : "challenged_progress";
    
    await supabaseAdmin
      .from("challenges")
      .update({ [updateField]: progress })
      .eq("id", challenge.id);

    // Check if challenge is completed
    if (progress >= challenge.target_problems) {
      await supabaseAdmin
        .from("challenges")
        .update({ 
          status: "completed",
          winner_id: userId
        })
        .eq("id", challenge.id);
    }
  }

  return NextResponse.json({ message: "Progress updated" });
}