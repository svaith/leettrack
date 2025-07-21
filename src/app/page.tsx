"use client";

import { useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-700">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="mb-8">
              <h1 className="text-7xl md:text-8xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                LeetTrack
              </h1>
              <div className="w-32 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 mx-auto rounded-full mb-8"></div>
              <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-light">
                Track your LeetCode progress
              </p>
              <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
                Turn your friends into coding accountability partners 🚀
              </p>
              <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
                Stay motivated, build consistency, and grow together through friendly competition
              </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Link href="/login">
                <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-2xl rounded-2xl">
                  Get Started - Sign In
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-6">
                Start your coding accountability journey today!
              </p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-20"></div>
        </div>
        <div className="absolute top-40 right-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-20"></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}>
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000 delay-500">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose LeetTrack?
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to excel in your coding journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-left-4 duration-1000 delay-700">
            <div className="text-6xl mb-6 animate-bounce">📊</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Track Progress</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your progress and stay accountable with detailed statistics that you can share with your coding buddies.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-800">
            <div className="text-6xl mb-6 animate-bounce" style={{animationDelay: '0.5s'}}>👥</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Compete with Friends</h3>
            <p className="text-gray-600 leading-relaxed">
              Build your accountability network. Challenge friends, celebrate wins together, and keep each other motivated.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-right-4 duration-1000 delay-900">
            <div className="text-6xl mb-6 animate-bounce" style={{animationDelay: '1s'}}>🔥</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Build Streaks</h3>
            <p className="text-gray-600 leading-relaxed">
              Consistency is everything. Build streaks together with friends who'll keep you accountable every single day.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Level Up Your Coding?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Start building your coding accountability network and stay motivated with friends.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-2xl rounded-2xl">
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            LeetTrack
          </div>
          <p className="text-gray-400">
            Empowering developers to achieve their coding goals through friendly competition and progress tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}