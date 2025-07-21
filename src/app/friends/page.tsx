"use client";

import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ChallengeModal } from "@/components/ui/challenge-modal";
import { useTheme } from "@/contexts/ThemeContext";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  friend?: {
    id: string;
    email: string;
    leetcode_username: string;
    total_solved: number;
  };
  requester?: {
    id: string;
    email: string;
    leetcode_username: string;
    total_solved: number;
  };
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  requester: {
    id: string;
    email: string;
    leetcode_username: string;
    total_solved: number;
  };
}

export default function Friends() {
  const user = useUser();
  const { theme } = useTheme();
  const [friendEmail, setFriendEmail] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{message: string; type: "success" | "error"} | null>(null);
  const [challengeModal, setChallengeModal] = useState<{isOpen: boolean; friendName: string; friendId: string} | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchFriendsAndRequests();
      fetchChallenges();
    }
  }, [user]);

  const fetchFriendsAndRequests = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/friends", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      setFriends(data.friends || []);
      setIncomingRequests(data.incomingRequests || []);
    }
    setLoading(false);
  };

  const sendFriendRequest = async () => {
    if (!user || !friendEmail.trim()) return;

    setSending(true);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/friends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friendEmail }),
    });

    if (response.ok) {
      setFriendEmail("");
      setToast({message: "Friend request sent successfully! 🎉", type: "success"});
    } else {
      const error = await response.json();
      setToast({message: error.error || "Failed to send friend request", type: "error"});
    }
    setSending(false);
  };

  const fetchChallenges = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/challenges", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      setChallenges(data.challenges || []);
    }
  };

  const handleChallenge = async (friendId: string, challengeData: any) => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/challenges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        challengedId: friendId,
        ...challengeData
      }),
    });

    if (response.ok) {
      setToast({message: "Challenge sent successfully! 🏆", type: "success"});
      fetchChallenges();
    } else {
      const error = await response.json();
      setToast({message: error.error || "Failed to send challenge", type: "error"});
    }
  };

  const handleChallengeResponse = async (challengeId: string, action: 'accept' | 'decline') => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/challenges", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ challengeId, action }),
    });

    if (response.ok) {
      setToast({
        message: action === 'accept' ? "Challenge accepted! Let's compete! 🏆" : "Challenge declined",
        type: "success"
      });
      fetchChallenges();
    }
  };

  const handleClaimPoints = async (challengeId: string) => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/challenges", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ challengeId, action: 'claim' }),
    });

    if (response.ok) {
      setToast({
        message: "Points claimed successfully! 🎉",
        type: "success"
      });
      fetchChallenges();
    }
  };

  const handleFriendRequest = async (requestId: string, action: "accepted" | "rejected") => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/friends", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friendRequestId: requestId, action }),
    });

    if (response.ok) {
      fetchFriendsAndRequests();
      setToast({
        message: action === "accepted" ? "Friend request accepted! 🤝" : "Friend request declined",
        type: "success"
      });
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
          <p className="text-xl text-gray-700">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto pt-10 pb-16 px-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Friends & Competitions
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4 text-lg">Build your coding accountability network 👥</p>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">Friends who code together, grow together. Stay motivated and consistent!</p>
        </div>

        {/* Add Friend Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Add Friend</h2>
          <div className="flex gap-4">
            <Input
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Enter friend's email"
              className="flex-1 transition-all duration-200 focus:scale-105"
            />
            <Button
              onClick={sendFriendRequest}
              disabled={sending || !friendEmail.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {sending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </div>

        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              Friend Requests 
              <span className="ml-2 bg-red-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {incomingRequests.length}
              </span>
            </h2>
            <div className="space-y-4">
              {incomingRequests.map((request, index) => (
                <div key={request.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in fade-in duration-500" style={{animationDelay: `${index * 100}ms`}}>
                  <div>
                    <p className="font-semibold text-gray-900">{request.requester.leetcode_username || "Anonymous"}</p>
                    <p className="text-sm text-gray-600">
                      {request.requester.email} • 
                      Solved: {request.requester.total_solved}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleFriendRequest(request.id, "accepted")}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleFriendRequest(request.id, "rejected")}
                      variant="outline"
                      size="sm"
                      className="hover:scale-105 transition-all duration-200 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenge Requests */}
        {challenges.filter(c => c.status === 'pending' && c.challenged_id === user?.id).length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700 delay-350">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              Challenge Requests
              <span className="ml-2 bg-orange-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {challenges.filter(c => c.status === 'pending' && c.challenged_id === user?.id).length}
              </span>
            </h2>
            <div className="space-y-4">
              {challenges.filter(c => c.status === 'pending' && c.challenged_id === user?.id).map((challenge, index) => (
                <div key={challenge.id} className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in fade-in duration-500" style={{animationDelay: `${index * 100}ms`}}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{challenge.title}</h3>
                      <p className="text-sm text-gray-600">from {challenge.challenger.leetcode_username}</p>
                      {challenge.description && (
                        <p className="text-gray-700 mt-2">{challenge.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{challenge.target_problems} problems</span> in <span className="font-medium">{challenge.duration_days} days</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleChallengeResponse(challenge.id, 'accept')}
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleChallengeResponse(challenge.id, 'decline')}
                        variant="outline"
                        size="sm"
                        className="hover:scale-105 transition-all duration-200 border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Challenges */}
        {challenges.filter(c => c.status === 'active' || c.status === 'completed').length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-375">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Active Challenges 🏆</h2>
            <div className="space-y-6">
              {challenges.filter(c => c.status === 'active' || c.status === 'completed').map((challenge, index) => {
                const isChallenger = challenge.challenger_id === user?.id;
                const myProgress = isChallenger ? challenge.challenger_progress : challenge.challenged_progress;
                const opponentProgress = isChallenger ? challenge.challenged_progress : challenge.challenger_progress;
                const opponentName = isChallenger ? challenge.challenged.leetcode_username : challenge.challenger.leetcode_username;
                const myProgressPercent = Math.min((myProgress / challenge.target_problems) * 100, 100);
                const opponentProgressPercent = Math.min((opponentProgress / challenge.target_problems) * 100, 100);
                const isCompleted = challenge.status === 'completed';
                const isWinner = challenge.winner_id === user?.id;
                const canClaim = isCompleted && isWinner;
                
                return (
                  <div key={challenge.id} className={`p-6 rounded-xl border hover:shadow-md transition-all duration-300 animate-in fade-in duration-500 ${
                    isCompleted 
                      ? (isWinner ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200')
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`} style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{challenge.title}</h3>
                        <p className="text-sm text-gray-600">vs {opponentName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Target: {challenge.target_problems} problems • {challenge.duration_days} days
                        </p>
                      </div>
                      <div className="text-right">
                        {isCompleted ? (
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 ${
                              isWinner ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {isWinner ? '🏆 You Won!' : '😔 You Lost'}
                            </div>
                            {canClaim && (
                              <Button
                                onClick={() => handleClaimPoints(challenge.id)}
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105"
                              >
                                Claim {challenge.target_problems} Points
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-indigo-700">You</span>
                          <span className="font-bold">{myProgress}/{challenge.target_problems}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500" style={{width: `${myProgressPercent}%`}}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{opponentName}</span>
                          <span className="font-bold">{opponentProgress}/{challenge.target_problems}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-gray-400 to-gray-600 h-3 rounded-full transition-all duration-500" style={{width: `${opponentProgressPercent}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Your Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <div className="text-6xl mb-4">🤝</div>
              <p className="text-gray-600 text-lg mb-6">No friends yet. Add some friends to start competing!</p>
              <div className="text-sm text-gray-500">
                Share your email with friends so they can add you!
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {friends.map((friendship, index) => {
                const friend = friendship.friend || friendship.requester;
                const hasActiveChallenge = challenges.some(c => 
                  (c.challenger_id === friend?.id || c.challenged_id === friend?.id) && 
                  ['active', 'completed'].includes(c.status)
                );
                const hasPendingChallenge = challenges.some(c => 
                  (c.challenger_id === friend?.id || c.challenged_id === friend?.id) && 
                  c.status === 'pending'
                );
                
                return (
                  <div key={friendship.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-in fade-in duration-500" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(friend?.leetcode_username || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{friend?.leetcode_username || "Anonymous"}</p>
                        <p className="text-sm text-gray-600">
                          {friend?.email} • 
                          Solved: {friend?.total_solved || 0} problems
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!hasActiveChallenge && !hasPendingChallenge ? (
                        <Button
                          onClick={() => setChallengeModal({
                            isOpen: true,
                            friendName: friend?.leetcode_username || "Friend",
                            friendId: friend?.id || ""
                          })}
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-200 hover:scale-105"
                        >
                          🏆 Challenge
                        </Button>
                      ) : hasPendingChallenge ? (
                        <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                          Challenge Pending
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          Challenge Active
                        </span>
                      )}
                      <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-sm font-medium">
                        ✓ Friends
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {challengeModal && (
        <ChallengeModal
          isOpen={challengeModal.isOpen}
          onClose={() => setChallengeModal(null)}
          friendName={challengeModal.friendName}
          friendId={challengeModal.friendId}
          onChallenge={(challengeData) => handleChallenge(challengeModal.friendId, challengeData)}
        />
      )}
    </div>
  );
}