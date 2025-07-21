"use client";

import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabase";
import { Button } from "./button";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navigation() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user || pathname === "/login") {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              LeetTrack
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button 
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/friends">
              <Button 
                variant={pathname === "/friends" ? "default" : "ghost"}
                size="sm"
              >
                Friends
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button 
                variant={pathname === "/leaderboard" ? "default" : "ghost"}
                size="sm"
              >
                Leaderboard
              </Button>
            </Link>
            
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="dark:text-gray-200"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}