'use client';

import React from 'react';
import { 
  FaGoogle, 
  FaFacebookF, 
  FaEnvelope, 
  FaMobile,
  FaUsers,
  FaShieldAlt,
} from 'react-icons/fa';

function WhyMultiChannel() {
  return (
    <section className='md:py-32 py-20 px-8 bg-gradient-to-b from-gray-50 to-white relative'>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-6xl">📊</div>
        <div className="absolute top-40 right-20 text-4xl">📱</div>
        <div className="absolute bottom-32 left-1/4 text-5xl">💻</div>
        <div className="absolute bottom-20 right-1/3 text-3xl">🎯</div>
      </div>
      
      <div className='max-w-[1200px] mx-auto relative z-10'>
        <div className='text-center mb-20' data-aos="fade-up">
          <div className="inline-block bg-[#204D9D]/10 rounded-full px-8 py-3 mb-6">
            <span className="text-[#204D9D] font-semibold">Why It Matters</span>
          </div>
          <h2 className='md:text-5xl text-3xl font-extrabold text-[#000] mb-8 tracking-tight'>
            Why Multi-Channel Marketing <span className="text-[#204D9D]">Matters</span>
          </h2>
        </div>

        <div className='flex md:flex-row flex-col gap-16 items-center'>
          <div className='md:w-[60%] w-full' data-aos="fade-right">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#204D9D]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <FaUsers className="text-[#204D9D] text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#204D9D] mb-3">Consumer Behavior Shift</h3>
                  <p className='text-gray-600 text-lg leading-relaxed'>
                    Consumer behavior has shifted dramatically in recent years. No longer does a single channel suffice; today's prospects scroll through social media, browse search engines, check their email, and use mobile apps—all within a single day. If your marketing efforts are limited to just one platform, you're missing out on a large portion of potential leads.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#306A64]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <FaShieldAlt className="text-[#306A64] text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#306A64] mb-3">Cohesive Brand Experience</h3>
                  <p className='text-gray-600 text-lg leading-relaxed'>
                    Multi-channel marketing not only broadens your reach but also creates a cohesive brand experience. When customers see consistent messaging across various channels, trust is built more quickly, and the likelihood of lead conversion increases significantly. It also allows your business to stay top of mind, no matter where your prospects are in their buyer journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className='md:w-[40%] w-full' data-aos="fade-left">
            <div className='relative'>
              {/* Floating stats cards */}
              <div className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-xl p-4 border border-[#204D9D]/10 z-20 animate-float">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#204D9D]">87%</div>
                  <div className="text-xs text-gray-600">Multi-Touch</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-[#306A64]/10 z-20 animate-float delay-500">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#306A64]">3.2x</div>
                  <div className="text-xs text-gray-600">Better ROI</div>
                </div>
              </div>
              
              <div className='bg-gradient-to-br from-[#204D9D] via-[#2558b8] to-[#306A64] rounded-3xl p-10 text-white text-center relative overflow-hidden'>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className='text-7xl mb-6 relative z-10'>📊</div>
                <h3 className='font-bold text-2xl mb-3 relative z-10'>Multi-Platform Reach</h3>
                <p className='text-white/90 text-lg relative z-10'>Consumers use multiple touchpoints daily</p>
                
                {/* Channel icons */}
                <div className="grid grid-cols-4 gap-4 mt-8 relative z-10">
                  {[FaFacebookF, FaGoogle, FaEnvelope, FaMobile].map((Icon, index) => (
                    <div key={index} className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300">
                      <Icon className="text-white" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyMultiChannel;