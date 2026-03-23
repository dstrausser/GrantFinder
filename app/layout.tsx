import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrantFinder - Find Grants for Non-Profits",
  description:
    "AI-powered tool to find state, local, and federal grants for non-profit organizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
                GF
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  GrantFinder
                </h1>
                <p className="text-xs text-gray-500">
                  AI-Powered Grant Search for Non-Profits
                </p>
              </div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
