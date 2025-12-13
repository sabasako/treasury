import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TreasuAI - Transaction Management",
  description: "Manage your transactions and balance with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {children}
      </body>
    </html>
  );
}
