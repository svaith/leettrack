import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { rateLimit, createSecureResponse, createSecureErrorResponse } from "../../../lib/security";

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_challenges_post', 5, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { challengedId, title, description, targetProblems, durationDays } = await req.json();

  if (!challengedId || !title || !targetProblems || !durationDays) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if there's already an active challenge between these users
  const { data: existingChallenge } = await supabaseAdmin
    .from("challenges")
    .select("id")
    .or(`and(challenger_id.eq.${userId},challenged_id.eq.${challengedId}),and(challenger_id.eq.${challengedId},challenged_id.eq.${userId})`)
    .in("status", ["pending", "active", "completed"])
    .limit(1);

  if (existingChallenge && existingChallenge.length > 0) {
    return NextResponse.json({ error: "You already have an active challenge with this friend" }, { status: 400 });
  }

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from("challenges")
    .insert({
      challenger_id: userId,
      challenged_id: challengedId,
      title,
      description,
      target_problems: targetProblems,
      duration_days: durationDays,
      start_date: startDate,
      end_date: endDate,
      status: 'pending'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return createSecureResponse({ challenge: data });
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_challenges_get', 30, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { data: challenges, error } = await supabaseAdmin
    .from("challenges")
    .select(`
      *,
      challenger:challenger_id(leetcode_username),
      challenged:challenged_id(leetcode_username)
    `)
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return createSecureResponse({ challenges });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_challenges_patch', 10, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { challengeId, action } = await req.json();

  if (!challengeId || !action) {
    return NextResponse.json({ error: "Missing challengeId or action" }, { status: 400 });
  }

  let updateData: any = {};

  if (action === 'claim') {
    // Get challenge details and award points
    const { data: challenge } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("winner_id", userId)
      .eq("status", "completed")
      .single();

    if (challenge) {
      const bonusPoints = challenge.target_problems;
      
      // Add bonus points to user
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("total_points")
        .eq("id", userId)
        .single();

      if (userData) {
        await supabaseAdmin
          .from("users")
          .update({ total_points: (userData.total_points || 0) + bonusPoints })
          .eq("id", userId);
      }

      // Delete the challenge
      await supabaseAdmin
        .from("challenges")
        .delete()
        .eq("id", challengeId);

      return createSecureResponse({ message: "Points claimed and challenge completed" });
    }
  } else if (action === 'accept') {
    // Get current totals for both users
    const { data: challengeData } = await supabaseAdmin
      .from("challenges")
      .select("challenger_id, challenged_id")
      .eq("id", challengeId)
      .single();

    if (challengeData) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, total_solved")
        .in("id", [challengeData.challenger_id, challengeData.challenged_id]);

      const challengerTotal = users?.find(u => u.id === challengeData.challenger_id)?.total_solved || 0;
      const challengedTotal = users?.find(u => u.id === challengeData.challenged_id)?.total_solved || 0;

      updateData = { 
        status: 'active',
        challenger_start_total: challengerTotal,
        challenged_start_total: challengedTotal
      };
    } else {
      updateData = { status: 'active' };
    }
  } else if (action === 'decline') {
    updateData = { status: 'declined' };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("challenges")
    .update(updateData)
    .eq("id", challengeId)
    .eq("challenged_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return createSecureResponse({ message: "Challenge updated" });
}