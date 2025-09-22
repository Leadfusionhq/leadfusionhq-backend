'use client';

import React from 'react';
import Image from 'next/image';
import { 
  FaSearch, 
  FaGoogle, 
  FaFacebookF, 
  FaChartLine,
  FaChartBar,
  FaRocket,
  FaUsers,
  FaShieldAlt,
  FaGlobe
} from 'react-icons/fa';

function LearnMoreBanner() {
  return (
       <section className='relative overflow-hidden bg-gradient-to-br from-[#204D9D] via-[#2558b8] to-[#306A64] py-20 px-8'>
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 rounded-full blur-md"></div>
      </div>
      
      <div className='max-w-[1200px] mx-auto flex md:flex-row flex-col gap-12 items-center relative z-10'>
        <div className='md:w-[60%] w-full' data-aos="fade-right">
          <div className="mb-6">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <span className="text-white/90 text-sm font-medium">🚀 Multi-Channel Marketing Excellence</span>
            </div>
          </div>
          <h1 className='text-white md:text-6xl text-4xl font-extrabold mb-8 leading-[1.1] tracking-tight'>
            Discover the Power of <span className="text-yellow-300">Multi-Channel Marketing</span> with Lead Fusion HQ
          </h1>
          <div className="space-y-6">
            <p className='text-white/95 text-xl font-light leading-relaxed'>
              In today's fast-paced and highly competitive marketplace, reaching your target audience requires more than just a single touchpoint. Consumers are everywhere — on social media, email, search engines, mobile apps, and more. To truly maximize your outreach and generate high-quality leads, you need a comprehensive, multi-channel marketing approach that leverages the full spectrum of digital platforms.
            </p>
            <p className='text-white/85 text-lg font-light leading-relaxed'>
              At Lead Fusion HQ, we specialize in delivering precisely that. Our multi-channel marketing solutions are designed to connect your business with potential customers across multiple channels, increasing visibility, engagement, and conversions. With our innovative, data-driven strategies, we ensure your message reaches the right audience, at the right time, through the right medium.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <FaUsers className="text-yellow-300" />
              <span className="text-white text-sm">Multi-Platform Reach</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <FaChartLine className="text-yellow-300" />
              <span className="text-white text-sm">Data-Driven Results</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <FaShieldAlt className="text-yellow-300" />
              <span className="text-white text-sm">Proven Strategies</span>
            </div>
          </div>
        </div>
        <div className='md:w-[40%] w-full relative' data-aos="fade-left">
          <div className='relative'>
            {/* Floating elements around the main content */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce delay-100">
              <FaGlobe className="text-white text-2xl" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400/90 rounded-xl flex items-center justify-center animate-pulse">
              <FaRocket className="text-white text-lg" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce delay-300">
              <FaChartBar className="text-white text-xl" />
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="text-center space-y-6">
                <div className="text-8xl">🎯</div>
                <h3 className="text-white text-2xl font-bold">Multi-Channel Excellence</h3>
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FaSearch className="text-white" />
                    </div>
                    <span className="text-white/90 text-xs">SEO</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FaGoogle className="text-white" />
                    </div>
                    <span className="text-white/90 text-xs">PPC</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FaFacebookF className="text-white" />
                    </div>
                    <span className="text-white/90 text-xs">Social</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LearnMoreBanner;