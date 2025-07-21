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
  // Update streak when user solves problems
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_streaks', 20, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { problemsSolved } = await req.json();
  if (typeof problemsSolved !== "number") {
    return NextResponse.json({ error: "Problems solved count required" }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Get user's current data
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("total_solved, last_solved_date, current_streak, max_streak")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const previousTotal = userData.total_solved || 0;
  const lastSolvedDate = userData.last_solved_date;
  const currentStreak = userData.current_streak || 0;
  const maxStreak = userData.max_streak || 0;



  // Check if user solved new problems
  if (problemsSolved <= previousTotal) {
    // No new problems solved - check if streak should be reset to 0
    if (lastSolvedDate) {
      const lastDate = new Date(lastSolvedDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // More than 1 day gap - reset streak to 0
        const { error: resetError } = await supabaseAdmin
          .from("users")
          .update({
            current_streak: 0
          })
          .eq("id", userId);
        
        return createSecureResponse({ 
          message: "Streak reset due to inactivity",
          currentStreak: 0,
          maxStreak 
        });
      }
    }
    
    return createSecureResponse({ 
      message: "No new problems solved",
      currentStreak,
      maxStreak 
    });
  }

  let newCurrentStreak = currentStreak;
  let newMaxStreak = maxStreak;

  // Calculate streak
  if (!lastSolvedDate || lastSolvedDate === null) {
    // First time solving
    newCurrentStreak = 1;
  } else {
    const lastDate = new Date(lastSolvedDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      newCurrentStreak = currentStreak + 1;
    } else if (diffDays === 0) {
      // Same day, keep current streak (but ensure it's at least 1)
      newCurrentStreak = Math.max(currentStreak, 1);
    } else {
      // Streak broken, start new streak
      newCurrentStreak = 1;
    }
  }

  // Update max streak if current is higher
  if (newCurrentStreak > maxStreak) {
    newMaxStreak = newCurrentStreak;
  }

  // Update user data
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      total_solved: problemsSolved,
      last_solved_date: today,
      current_streak: newCurrentStreak,
      max_streak: newMaxStreak
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return createSecureResponse({
    message: "Streak updated",
    currentStreak: newCurrentStreak,
    maxStreak: newMaxStreak,
    problemsSolved
  });
}

export async function GET(req: NextRequest) {
  // Get user's streak info
  const userId = await getUserIdFromRequest(req);
  if (!userId) return createSecureErrorResponse("Unauthorized", 401);

  // Rate limiting
  if (!rateLimit(userId + '_streaks_get', 30, 60000)) {
    return createSecureErrorResponse("Too many requests", 429);
  }

  const { data: userData, error } = await supabaseAdmin
    .from("users")
    .select("current_streak, max_streak, last_solved_date, total_solved")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return createSecureResponse({
    currentStreak: userData?.current_streak || 0,
    maxStreak: userData?.max_streak || 0,
    lastSolvedDate: userData?.last_solved_date,
    totalSolved: userData?.total_solved || 0
  });
}