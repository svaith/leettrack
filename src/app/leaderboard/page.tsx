"use client";

import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useTheme } from "@/contexts/ThemeContext";

interface LeaderboardEntry {
  id: string;
  email: string;
  leetcode_username: string;
  total_solved: number;
  total_points: number;
  rank: number;
  isCurrentUser: boolean;
  current_streak?: number;
  max_streak?: number;
  easy_solved?: number;
  medium_solved?: number;
  hard_solved?: number;
}

export default function Leaderboard() {
  const user = useUser();
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [acceptedFriends, setAcceptedFriends] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{message: string; type: "success" | "error"} | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchGlobalLeaderboard();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/leaderboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    }
    setLoading(false);
  };

  const fetchGlobalLeaderboard = async () => {
    const response = await fetch("/api/global-leaderboard");
    if (response.ok) {
      const data = await response.json();
      setGlobalLeaderboard(data.globalLeaderboard || []);
      await checkExistingFriendships(data.globalLeaderboard || []);
    }
  };

  const checkExistingFriendships = async (users: LeaderboardEntry[]) => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/friends", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      const acceptedEmails = new Set<string>();
      const pendingEmails = new Set<string>();
      
      // Add accepted friends
      data.friends?.forEach((friendship: any) => {
        const friend = friendship.friend || friendship.requester;
        if (friend?.email) acceptedEmails.add(friend.email);
      });
      
      // Add pending requests (both sent and received)
      data.incomingRequests?.forEach((request: any) => {
        if (request.requester?.email) pendingEmails.add(request.requester.email);
      });
      
      setAcceptedFriends(acceptedEmails);
      setPendingRequests(pendingEmails);
    }
  };

  const sendFriendRequest = async (userEmail: string, username: string) => {
    if (!user || !userEmail) return;

    setSendingRequest(userEmail);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/friends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friendEmail: userEmail }),
    });

    if (response.ok) {
      setPendingRequests(prev => new Set([...prev, userEmail]));
      setToast({message: `Friend request sent to ${username}! 🎉`, type: "success"});
    } else {
      const error = await response.json();
      setToast({message: error.error || "Failed to send friend request", type: "error"});
    }
    setSendingRequest(null);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-600 bg-gradient-to-r from-yellow-100 to-yellow-200";
      case 2: return "text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200";
      case 3: return "text-orange-600 bg-gradient-to-r from-orange-100 to-orange-200";
      default: return "text-indigo-600 bg-gradient-to-r from-indigo-100 to-indigo-200";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-700">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl text-gray-700">Please log in first.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-700">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const currentLeaderboard = activeTab === 'friends' ? leaderboard : globalLeaderboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto pt-10 pb-16 px-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4 text-lg">See how you rank among your accountability partners</p>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">Friendly competition keeps everyone motivated and growing together!</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-6 duration-700 delay-200">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 dark:border-gray-700/20">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'global'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              Global
            </button>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {activeTab === 'friends' ? (
            leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600 dark:text-gray-200 mb-4 text-lg">No friends to compete with yet!</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Add friends to see how you rank against them.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-6 flex items-center justify-between transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 animate-in fade-in duration-500 ${
                      entry.isCurrentUser ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border-l-4 border-indigo-500" : ""
                    }`}
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <p className={`font-bold text-lg ${entry.isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-gray-100"}`}>
                          {entry.leetcode_username || "Anonymous"} {entry.isCurrentUser && "(You)"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Current: {entry.current_streak || 0} 🔥 • Best: {entry.max_streak || 0} days
                        </p>
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className={`text-3xl font-bold ${entry.isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {entry.total_points || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">points</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.total_solved} problems</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {globalLeaderboard.map((entry, index) => {
                const isCurrentUser = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`p-6 flex items-center justify-between transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 animate-in fade-in duration-500 ${
                      isCurrentUser ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border-l-4 border-indigo-500" : ""
                    }`}
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <p className={`font-bold text-lg ${isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-gray-100"}`}>
                          {entry.leetcode_username || "Anonymous"} {isCurrentUser && "(You)"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Current: {entry.current_streak || 0} 🔥 • Best: {entry.max_streak || 0} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="min-w-[120px] flex justify-start">
                        {!isCurrentUser && !acceptedFriends.has(entry.email) && !pendingRequests.has(entry.email) && (
                          <Button
                            onClick={() => sendFriendRequest(entry.email, entry.leetcode_username)}
                            disabled={sendingRequest === entry.email}
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                          >
                            {sendingRequest === entry.email ? (
                              <div className="flex items-center space-x-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                <span className="text-xs">Sending...</span>
                              </div>
                            ) : (
                              "Add Friend"
                            )}
                          </Button>
                        )}
                        {!isCurrentUser && pendingRequests.has(entry.email) && (
                          <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                            Request Pending ⏳
                          </span>
                        )}
                        {!isCurrentUser && acceptedFriends.has(entry.email) && (
                          <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            Friends ✓
                          </span>
                        )}
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className={`text-3xl font-bold ${isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-600 dark:text-indigo-400"}`}>
                          {entry.total_points || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">points</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{entry.total_solved} problems</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Points Explanation */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">🎯 How Points Are Scored</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-2xl mb-1">🟢</div>
              <div className="font-bold text-green-700">Easy</div>
              <div className="text-sm text-green-600">1 point</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-2xl mb-1">🟡</div>
              <div className="font-bold text-yellow-700">Medium</div>
              <div className="text-sm text-yellow-600">2 points</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-2xl mb-1">🔴</div>
              <div className="font-bold text-red-700">Hard</div>
              <div className="text-sm text-red-600">3 points</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="text-2xl mb-1">🔥</div>
              <div className="font-bold text-orange-700">Streak</div>
              <div className="text-sm text-orange-600">5 points/day</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Consistency is rewarded! Daily streaks give bonus points to encourage regular practice.
          </p>
        </div>

        <div className="mt-8 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 hover:scale-105 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-3 animate-pulse">🔥 Keep Grinding!</h2>
          <p className="text-indigo-100 text-lg">
            {activeTab === 'friends' 
              ? 'Your friends are counting on you to stay consistent. Keep pushing each other to grow!' 
              : 'Join a global community of motivated developers. Accountability works at every scale!'}
          </p>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}