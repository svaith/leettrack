import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  // Get all users with LeetCode usernames, ordered by points
  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, email, leetcode_username, total_solved, current_streak, max_streak, total_points, easy_solved, medium_solved, hard_solved")
    .not("leetcode_username", "is", null)
    .order("total_points", { ascending: false })
    .limit(50); // Top 50 users

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Add rank to each user
  const globalLeaderboard = users?.map((user, index) => ({
    ...user,
    rank: index + 1
  })) || [];

  return NextResponse.json({ globalLeaderboard });
}