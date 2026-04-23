import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patient Admission — Visayas Medical",
  description:
    "Secure patient admission form for Visayas Medical Center. Submit patient information quickly and accurately.",
};

import { Toaster } from "react-hot-toast";
import { StatusModalProvider } from "./components/StatusModalContext";
import { SidebarProvider } from "./components/SidebarContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <StatusModalProvider>
          <SidebarProvider>
            <Toaster position="top-right" />
            {children}
          </SidebarProvider>
        </StatusModalProvider>
      </body>
    </html>
  );
}
