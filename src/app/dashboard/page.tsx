"use client";

import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

interface Friend {
  email: string;
  leetcode_username: string;
  total_solved: number;
  isCurrentUser?: boolean;
}

export default function Dashboard() {
  const user = useUser();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalSolved, setTotalSolved] = useState<number | null>(null);
  const [topFriends, setTopFriends] = useState<Friend[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [difficultyStats, setDifficultyStats] = useState({ Easy: 0, Medium: 0, Hard: 0 });
  const [profileData, setProfileData] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [ranking, setRanking] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserProfileAndStats = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("leetcode_username, total_solved, display_name, current_streak, max_streak")
        .eq("id", user.id)
        .single();

      if (!data) {
        await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            leetcode_username: null,
            total_solved: 0,
          },
        ]);
      } else {
        if (data.leetcode_username) {
          setUsername(data.leetcode_username);
          setCurrentStreak(data.current_streak || 0);
          setMaxStreak(data.max_streak || 0);
          setSubmitted(true);
          await fetchAndUpdateLeetCodeStats(data.leetcode_username);
        }
      }
      await fetchFriendsPreview();
      setLoading(false);
    };
    fetchUserProfileAndStats();
  }, [user]);

  const fetchFriendsPreview = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    try {
      const [friendsRes, leaderboardRes] = await Promise.all([
        fetch("/api/friends", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leaderboard", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendsCount(friendsData.friends?.length || 0);
        setPendingRequestsCount(friendsData.incomingRequests?.length || 0);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setTopFriends(leaderboardData.leaderboard?.slice(0, 5) || []);
      }
    } catch (error) {
      // Error handled silently in production
    }
  };

  const fetchAndUpdateLeetCodeStats = async (lcUsername: string) => {
    setLoading(true);
    const res = await fetch("/api/leetcode-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: lcUsername }),
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const json = await res.json();
    const matchedUser = json?.data?.matchedUser;
    const stats = matchedUser?.submitStats?.acSubmissionNum || [];
    const total = stats.find((d: any) => d.difficulty === "All")?.count ?? 0;
    
    // Extract difficulty breakdown
    const easy = stats.find((d: any) => d.difficulty === "Easy")?.count ?? 0;
    const medium = stats.find((d: any) => d.difficulty === "Medium")?.count ?? 0;
    const hard = stats.find((d: any) => d.difficulty === "Hard")?.count ?? 0;
    
    // Extract additional profile data
    setProfileData(matchedUser?.profile);
    setBadges(matchedUser?.badges || []);
    setRanking(matchedUser?.profile?.ranking);
    
    setDifficultyStats({ Easy: easy, Medium: medium, Hard: hard });
    setTotalSolved(total);
    
    // Update streak first
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    let updatedCurrentStreak = currentStreak;
    if (token) {
      const streakRes = await fetch("/api/streaks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ problemsSolved: total })
      });
      
      if (streakRes.ok) {
        const streakData = await streakRes.json();
        updatedCurrentStreak = streakData.currentStreak;
        setCurrentStreak(streakData.currentStreak);
        setMaxStreak(streakData.maxStreak);
      }
    }

    // Calculate points with updated streak: Easy=1, Medium=2, Hard=3, Current Streak=5
    const problemPoints = (easy * 1) + (medium * 2) + (hard * 3);
    const streakPoints = updatedCurrentStreak * 5;
    const totalPoints = problemPoints + streakPoints;

    await supabase.from("users").update({ 
      total_solved: total,
      easy_solved: easy,
      medium_solved: medium,
      hard_solved: hard,
      total_points: totalPoints
    }).eq("id", user?.id);
    
    // Update challenge progress
    if (token) {
      await fetch("/api/challenges/update-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentTotal: total })
      });
    }
    
    // Update challenge progress
    if (token) {
      await fetch("/api/challenges/update-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentTotal: total })
      });
    }
    
    setLoading(false);
  };

  const validateLeetCodeUsername = (username: string): boolean => {
    // LeetCode usernames: alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]+$/;
    return regex.test(username.trim());
  };

  const handleSubmit = async () => {
    if (!user || !username) return;
    
    // Validate username format
    if (!validateLeetCodeUsername(username)) {
      alert("Please enter a valid LeetCode username (letters, numbers, and underscores only)");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("users")
      .update({ leetcode_username: username.trim() })
      .eq("id", user.id);

    if (!error) {
      setSubmitted(true);
      await fetchAndUpdateLeetCodeStats(username);
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
        <div className="text-center animate-in fade-in duration-700">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Please log in first.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
        <div className="text-center animate-in fade-in duration-700">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto pt-10 pb-16 px-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-5xl font-extrabold mb-2 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to LeetTrack
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4 text-lg">Stay accountable, motivated, and consistent with your friends 🚀</p>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">Because coding is better when you're not doing it alone</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-top-6 duration-700 delay-200">
          <div className="flex items-center space-x-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 dark:border-gray-700/20">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="border-0 bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-600/80 dark:text-gray-200"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            <Link href="/friends">
              <Button variant="outline" className="relative hover:scale-105 transition-all duration-200 hover:shadow-md border-0 bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-600/80 dark:text-gray-200">
                👥 Friends ({friendsCount})
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" className="hover:scale-105 transition-all duration-200 hover:shadow-md border-0 bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-600/80 dark:text-gray-200">🏆 Leaderboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {/* Profile Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Your Profile</h2>
            {submitted ? (
              <>
                <p className="text-lg text-gray-800 mb-4">
                  LeetCode username:{" "}
                  <span className="font-semibold text-indigo-600">{username}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <p className="text-sm mb-2 opacity-90">Problems Solved</p>
                    <p className="text-4xl font-bold animate-in zoom-in duration-500">
                      {totalSolved ?? "..."}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <p className="text-sm mb-2 opacity-90">Current Streak</p>
                    <p className="text-4xl font-bold animate-in zoom-in duration-500 delay-100">
                      {currentStreak} 🔥
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Best Streak</p>
                    <p className="font-bold text-gray-800 text-lg">{maxStreak} days</p>
                  </div>
                  {ranking && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl p-4 border border-yellow-200">
                      <p className="text-sm text-gray-600">Global Ranking</p>
                      <p className="font-bold text-orange-700 text-lg">#{ranking.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                

                
                {/* Badges */}
                {badges && badges.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Badges 🏆</h4>
                    <div className="flex flex-wrap gap-2">
                      {badges.slice(0, 6).map((badge: any, index: number) => (
                        <div key={badge.id || index} className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg border border-purple-200">
                          <span className="text-sm font-medium text-purple-700">{badge.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Difficulty Breakdown Chart */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Problem Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm font-medium">Easy</span>
                      </div>
                      <span className="font-bold">{difficultyStats.Easy}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${totalSolved ? (difficultyStats.Easy / totalSolved) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm font-medium">Medium</span>
                      </div>
                      <span className="font-bold">{difficultyStats.Medium}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-1000 ease-out delay-200" 
                        style={{ width: `${totalSolved ? (difficultyStats.Medium / totalSolved) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm font-medium">Hard</span>
                      </div>
                      <span className="font-bold">{difficultyStats.Hard}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out delay-300" 
                        style={{ width: `${totalSolved ? (difficultyStats.Hard / totalSolved) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => fetchAndUpdateLeetCodeStats(username)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Refreshing...</span>
                    </div>
                  ) : (
                    "🔄 Refresh Stats"
                  )}
                </Button>
              </>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="mb-6 text-gray-700 text-lg">
                  Enter your LeetCode username to start tracking:
                </p>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="LeetCode username (required)"
                  className="mb-6 transition-all duration-200 focus:scale-105"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !username.trim()}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Getting Started...</span>
                    </div>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Friends Leaderboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Top Friends</h2>
            {topFriends.length === 0 ? (
              <div className="text-center py-12 animate-in fade-in duration-500">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600 mb-4 text-lg">No friends added yet!</p>
                <p className="text-gray-500 mb-6 text-sm">Add friends to stay motivated and accountable together</p>
                <Link href="/friends">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Find Your Coding Accountability Partners
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {topFriends.map((friend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl animate-bounce" style={{animationDelay: `${index * 100}ms`}}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"}
                        </span>
                        <div>
                          <p className={`font-semibold ${friend.isCurrentUser ? "text-indigo-600" : "text-gray-900"}`}>
                            {friend.leetcode_username || "Anonymous"} {friend.isCurrentUser && "(You)"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{friend.total_points || 0}</span>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/leaderboard">
                  <Button variant="outline" className="w-full hover:scale-105 transition-all duration-200 hover:shadow-md border-2 border-indigo-200 hover:border-indigo-300">View Full Leaderboard</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Motivational Section */}
        {submitted && (
          <div className="mt-12 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 hover:scale-105 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-3 animate-pulse">🎯 Keep Going!</h3>
            <p className="text-green-100 text-lg">
              Consistency is key. Solve at least one problem daily to stay sharp!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}