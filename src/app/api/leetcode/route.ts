// app/api/leetcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://leetcode.com/graphql/",
      {
        query,
        variables: { username },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const stats = response.data.data.matchedUser?.submitStats?.acSubmissionNum || [];
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
