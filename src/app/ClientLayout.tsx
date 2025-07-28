'use client';  

import { usePathname } from "next/navigation"; 
import MainHeader from "@/components/Layout/MainHeader/MainHeader";
import Footer from "@/components/Layout/Footer/Footer";

const includedPaths = ['/', '/contact-us','/term-of-service','/privacy-policy']; 

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); 
  const shouldShowHeaderFooter = includedPaths.includes(pathname);

  return (
    <>
      {shouldShowHeaderFooter && <MainHeader />}
      {children}
      {shouldShowHeaderFooter && <Footer />}
    </>
  );
}
