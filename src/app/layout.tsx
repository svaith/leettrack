// app/layout.tsx
import "./globals.css";
import { SupabaseProvider } from "@/components/ui/supabase-provider";
import Navigation from "@/components/ui/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata = {
  title: "LeetTrack",
  description: "Track your LeetCode progress with friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SupabaseProvider>
            <Navigation />
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
