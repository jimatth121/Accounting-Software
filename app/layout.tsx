import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SmartBooks AI — Accounting for modern businesses",
  description: "AI-powered accounting software for small businesses. Track invoices, expenses, payments, and grow with confidence."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorText: "#0f172a",
          borderRadius: "0.75rem"
        },
        elements: {
          formButtonPrimary:
            "bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-sm normal-case font-semibold shadow-lg shadow-brand-500/30"
        }
      }}
    >
      <html lang="en">
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
