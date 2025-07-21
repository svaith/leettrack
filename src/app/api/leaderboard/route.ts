import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;
  return user.id;
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's friends (accepted friendships)
  const { data: friendships, error: friendsError } = await supabaseAdmin
    .from("friends")
    .select("user_id, friend_id")
    .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`);

  if (friendsError) return NextResponse.json({ error: friendsError.message }, { status: 500 });

  // Extract friend IDs
  const friendIds = friendships?.map(f => 
    f.user_id === userId ? f.friend_id : f.user_id
  ) || [];

  // Include current user in leaderboard
  const allUserIds = [userId, ...friendIds];

  // Get user stats for leaderboard
  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, email, leetcode_username, total_solved, current_streak, max_streak, total_points, easy_solved, medium_solved, hard_solved")
    .in("id", allUserIds)
    .order("total_points", { ascending: false });

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Add rank to each user
  const leaderboard = users?.map((user, index) => ({
    ...user,
    rank: index + 1,
    isCurrentUser: user.id === userId
  })) || [];

  return NextResponse.json({ leaderboard });
}