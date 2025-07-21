import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          aboutMe
          userAvatar
          location
          websites
          skillTags
          company
          school
          ranking
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
          totalSubmissionNum {
            difficulty
            count
          }
        }
        badges {
          id
          displayName
          icon
          creationDate
        }
        activeBadge {
          displayName
          icon
        }
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch LeetCode data" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
