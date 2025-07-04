import Providers from "@/components/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

export const overusedGrotesk = localFont({
  src: [
    {
      path: "../styles/fonts/OverusedGrotesk-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-Book.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-Roman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../styles/fonts/OverusedGrotesk-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-overused-grotesk",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pullsmith",
  description: "Pullsmith is a platform <idk what to put here>",
};

const RootLayout = ({ children }: Readonly<React.PropsWithChildren>) => (
  <html lang="en" suppressHydrationWarning>
    <body
      className={cn(
        "font-overused-grotesk antialiased",
        overusedGrotesk.variable,
        geistMono.variable
      )}
    >
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
