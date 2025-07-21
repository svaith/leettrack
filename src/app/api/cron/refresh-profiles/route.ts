import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// This endpoint should be called by a cron job at 10:00 PM daily
export async function POST(req: NextRequest) {
  // Verify cron secret to ensure only authorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if it's 10:00 PM (22:00) in the server's timezone
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Allow a 5-minute window (22:00 to 22:05) to account for cron timing variations
  const is10PMWindow = (hour === 22 && minute >= 0 && minute <= 5);
  
  // For testing purposes, also allow manual triggering with a special header
  const isManualTrigger = req.headers.get("x-manual-trigger") === "true";
  
  if (!is10PMWindow && !isManualTrigger) {
    return NextResponse.json({ 
      error: "This endpoint should only be called at 10:00 PM",
      currentTime: `${hour}:${minute}`
    }, { status: 400 });
  }

  try {
    // Get all users with LeetCode usernames
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, leetcode_username")
      .not("leetcode_username", "is", null);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const refreshedUsers = [];
    const failedUsers = [];

    // Process each user
    for (const user of users) {
      try {
        // Fetch LeetCode stats
        const response = await fetch("https://leetcode.com/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query userProfile($username: String!) {
                matchedUser(username: $username) {
                  username
                  submitStats {
                    acSubmissionNum {
                      difficulty
                      count
                    }
                  }
                }
              }
            `,
            variables: { username: user.leetcode_username }
          })
        });

        if (!response.ok) {
          failedUsers.push(user.leetcode_username);
          continue;
        }

        const json = await response.json();
        const stats = json?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
        const total = stats.find((d: any) => d.difficulty === "All")?.count ?? 0;
        const easy = stats.find((d: any) => d.difficulty === "Easy")?.count ?? 0;
        const medium = stats.find((d: any) => d.difficulty === "Medium")?.count ?? 0;
        const hard = stats.find((d: any) => d.difficulty === "Hard")?.count ?? 0;

        // Update user stats
        await supabaseAdmin
          .from("users")
          .update({
            total_solved: total,
            easy_solved: easy,
            medium_solved: medium,
            hard_solved: hard,
            last_refresh: now.toISOString()
          })
          .eq("id", user.id);

        refreshedUsers.push(user.leetcode_username);
      } catch (err) {
        console.error(`Error refreshing user ${user.leetcode_username}:`, err);
        failedUsers.push(user.leetcode_username);
      }
    }

    return NextResponse.json({
      message: "10:00 PM Profile refresh completed",
      refreshed: refreshedUsers.length,
      failed: failedUsers.length,
      time: `${hour}:${minute}`
    });
  } catch (err) {
    console.error("Error in refresh-profiles:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}