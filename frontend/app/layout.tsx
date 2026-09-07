import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightFlow — AI Feedback Intelligence OS",
  description: "AI-Powered Feedback Intelligence & Explainable Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="h-full overflow-hidden bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
