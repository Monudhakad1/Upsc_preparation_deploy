import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pragati — UPSC Preparation Dashboard",
  description: "Private mentor-aspirant progress tracker for UPSC CSE preparation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
