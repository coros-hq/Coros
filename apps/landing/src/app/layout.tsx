import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/landing/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coros — The open-source company OS",
  description:
    "HR, employees, projects and documents unified in one calm surface. Free to self-host forever.",
  openGraph: {
    title: "Coros — The open-source company OS",
    description:
      "HR, employees, projects and documents unified in one calm surface.",
    url: "https://coros.click",
    images: [
      {
        url: "https://coros.click/coros-dashboard-mockup.png",
      },
    ],
  },
  icons: {
    icon: "../assets/logo.svg"
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full scroll-smooth',
        'antialiased',
        inter.variable,
        'font-sans'
      )}
    >
      <body className="flex min-h-full flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
