import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientComponent from "./ClientComponent"; // Import client provider wrapper
import Toaster from "@/components/common/Toaster";
import { Inter } from 'next/font/google';
import Footer from "@/components/Layout/Footer/Footer";
import MainHeader from "@/components/Layout/MainHeader/MainHeader";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AOSInitializer from "@/components/Layout/AOSInitializer/AOSInitializer";
import ClientLayout from "./ClientLayout"; 

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lead Fusion HQ",
  description: "A Powerful Lead Management Dashboard",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
    <html lang="en" className={``}>
      <body>
        <Toaster />
     
        <AOSInitializer/>
        <ClientComponent>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ClientComponent>
      </body>
    </html>
  );
}