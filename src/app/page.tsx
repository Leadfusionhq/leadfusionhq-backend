'use client';

// import BannerHome from "@/components/Layout/BannerHome/BannerHome";
import BannerHome from '@/components/Layout/BannerHome/BannerHome'
import Build4Growth from "@/components/Layout/Build4Growth/Build4Growth";
import FaqHome from "@/components/Layout/FaqHome/FaqHome";
import HomeCtaBanner from "@/components/Layout/HomeCtaBanner/HomeCtaBanner";
import HomeServices from "@/components/Layout/HomeServices/HomeServices";
import WhyChoose from "@/components/Layout/WhyChoose/WhyChoose";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
   <>
   {/* <BannerHome/> */}
   <BannerHome
      title="Discover the Power of Precision Marketing"
      description="Our data-driven lead generation helps your business connect with the right customers at the right time."
      buttonText="LEARN MORE"
      backgroundImage="/images/home-banner.png"
    />
   <Build4Growth/>
   <HomeServices/>
   <WhyChoose/>
   <HomeCtaBanner/>
   <FaqHome/>
   </>
  );
}
