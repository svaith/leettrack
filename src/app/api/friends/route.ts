import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { rateLimit, createSecureResponse, createSecureErrorResponse } from "../../../lib/security";

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

export async function POST(req: NextRequest) {
  // Send friend request
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_post', 5, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { friendEmail } = await req.json();
  if (!friendEmail) return NextResponse.json({ error: "Friend email required" }, { status: 400 });

  // Find friend user by email
  const { data: friendUser, error: findError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", friendEmail)
    .single();

  if (findError || !friendUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent sending friend request to yourself
  if (friendUser.id === userId) {
    return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
  }

  // Check if active friend request or friendship already exists (exclude rejected)
  const { data: existing } = await supabaseAdmin
    .from("friends")
    .select("*")
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${userId})`
    )
    .neq("status", "rejected");

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Friend request already exists or you are already friends" },
      { status: 409 }
    );
  }

  // Delete any old rejected requests to avoid duplicate key constraint
  await supabaseAdmin
    .from("friends")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${userId})`
    )
    .eq("status", "rejected");

  // Insert friend request with 'pending' status
  const { error: insertError } = await supabaseAdmin.from("friends").insert([
    {
      user_id: userId,
      friend_id: friendUser.id,
      status: "pending",
    },
  ]);

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ message: "Friend request sent" });
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return createSecureErrorResponse("Unauthorized", 401);

    // Rate limiting
    if (!rateLimit(userId, 30, 60000)) {
      return createSecureErrorResponse("Too many requests", 429);
    }

    // Get accepted friendships
    const { data: friendships, error: friendsError } = await supabaseAdmin
      .from("friends")
      .select("id, user_id, friend_id, status")
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`);

    if (friendsError) {
      console.error("Friends query error:", friendsError);
      return NextResponse.json({ error: friendsError.message }, { status: 500 });
    }

    // Get friend user details
    const friendIds = friendships?.map(f => f.user_id === userId ? f.friend_id : f.user_id) || [];
    const { data: friendUsers } = await supabaseAdmin
      .from("users")
      .select("id, email, leetcode_username, total_solved")
      .in("id", friendIds);

    const friends = friendships?.map(friendship => ({
      ...friendship,
      friend: friendUsers?.find(u => u.id === (friendship.user_id === userId ? friendship.friend_id : friendship.user_id))
    })) || [];

    // Get incoming friend requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from("friends")
      .select("id, user_id, friend_id, status")
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (requestsError) {
      console.error("Requests query error:", requestsError);
      return NextResponse.json({ error: requestsError.message }, { status: 500 });
    }

    // Get requester details
    const requesterIds = requests?.map(r => r.user_id) || [];
    const { data: requesterUsers } = await supabaseAdmin
      .from("users")
      .select("id, email, leetcode_username, total_solved")
      .in("id", requesterIds);

    const incomingRequests = requests?.map(request => ({
      ...request,
      requester: requesterUsers?.find(u => u.id === request.user_id)
    })) || [];

    return createSecureResponse({ friends, incomingRequests });
  } catch (error) {
    console.error("GET /api/friends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Accept or reject a friend request
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_patch', 10, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { friendRequestId, action } = await req.json();

  if (!friendRequestId || !["accepted", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify friend request belongs to current user as recipient
  const { data: friendRequest, error: frError } = await supabaseAdmin
    .from("friends")
    .select("*")
    .eq("id", friendRequestId)
    .single();

  if (frError || !friendRequest) {
    return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
  }

  if (friendRequest.friend_id !== userId) {
    return NextResponse.json({ error: "Not authorized to update this request" }, { status: 403 });
  }

  // Update friend request status
  const { error: updateError } = await supabaseAdmin
    .from("friends")
    .update({ status: action })
    .eq("id", friendRequestId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return createSecureResponse({ message: `Friend request ${action}` });
}
