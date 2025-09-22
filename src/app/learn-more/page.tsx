import React from 'react';
import LearnMoreBanner from '@/components/public/LearnMore/LearnMoreBanner';
import MultiChannelApproach from '@/components/public/LearnMore/MultiChannelApproach';
import WhyMultiChannel from '@/components/public/LearnMore/WhyMultiChannel';
import OurBenefits from '@/components/public/LearnMore/OurBenefits';
import LearnMoreCta from '@/components/public/LearnMore/LearnMoreCta';
import { Metadata } from "next";

export default function LearnMore() {
  return (
    <>
      <LearnMoreBanner />
      <WhyMultiChannel />
      <MultiChannelApproach />
      <OurBenefits />
      <LearnMoreCta />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Learn More | Multi-Channel Marketing Solutions | Lead Fusion HQ',
  description: 'Discover how our comprehensive multi-channel marketing approach can transform your lead generation and drive sustainable business growth.',
};