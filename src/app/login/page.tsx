"use client";

import { useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function LoginPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12">
          <div className="animate-in zoom-in duration-700 delay-200">
            <Link href="/" className="inline-block hover:scale-105 transition-all duration-200">
              <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                LeetTrack
              </h1>
            </Link>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto rounded-full mb-4"></div>
          </div>
          <p className="text-gray-600 text-lg animate-in fade-in duration-700 delay-300">
            Sign in to track your progress and compete with friends
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200 animate-in fade-in duration-700 delay-400">
            ← Back to Home
          </Link>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4f46e5',
                    brandAccent: '#4338ca',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f8fafc',
                    defaultButtonBackgroundHover: '#f1f5f9',
                    inputBackground: 'white',
                    inputBorder: '#e2e8f0',
                    inputBorderHover: '#cbd5e1',
                    inputBorderFocus: '#4f46e5',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button hover:scale-105 transition-all duration-200',
                input: 'auth-input transition-all duration-200 focus:scale-105',
              },
            }}
            providers={[]}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined}
          />
        </div>
        
        <div className="text-center mt-8 animate-in fade-in duration-700 delay-600">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>Join the community of motivated LeetCode practitioners!</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-xs text-gray-600">Track Progress</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-xs text-gray-600">Compete</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-xs text-gray-600">Build Streaks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
