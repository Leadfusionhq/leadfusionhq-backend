'use client';

import React from 'react';
import { 
  FaSearch, 
  FaGoogle, 
  FaFacebookF, 
  FaEnvelope, 
  FaEdit, 
  FaMobile,

} from 'react-icons/fa';

function MultiChannelApproach() {
  const channels = [
    {
      icon: FaSearch,
      title: 'Search Engine Optimization (SEO)',
      description: 'We optimize your website and content to rank higher in search results, attracting organic traffic seeking your services.',
      color: 'from-[#204D9D] to-[#2558b8]',
      bgColor: 'bg-[#204D9D]/5',
      iconColor: 'text-[#204D9D]'
    },
    {
      icon: FaGoogle,
      title: 'Pay-Per-Click Advertising (PPC)',
      description: 'We develop targeted ad campaigns on platforms like Google Ads and Bing, placing your brand directly in front of potential customers who are actively searching for your offerings.',
      color: 'from-[#306A64] to-[#4a8a82]',
      bgColor: 'bg-[#306A64]/5',
      iconColor: 'text-[#306A64]'
    },
    {
      icon: FaFacebookF,
      title: 'Social Media Marketing',
      description: 'We build engaging campaigns on Facebook, Instagram, LinkedIn, and other social networks to connect with your audience where they spend their time.',
      color: 'from-[#204D9D] to-[#2558b8]',
      bgColor: 'bg-[#204D9D]/5',
      iconColor: 'text-[#204D9D]'
    },
    {
      icon: FaEnvelope,
      title: 'Email Marketing',
      description: 'We create personalized email campaigns to nurture leads, build relationships, and drive conversions, keeping your brand top of mind.',
      color: 'from-[#306A64] to-[#4a8a82]',
      bgColor: 'bg-[#306A64]/5',
      iconColor: 'text-[#306A64]'
    },
    {
      icon: FaEdit,
      title: 'Content Marketing',
      description: 'We develop compelling content, including blogs, videos, and infographics, to establish authority and attract inbound inquiries.',
      color: 'from-[#204D9D] to-[#2558b8]',
      bgColor: 'bg-[#204D9D]/5',
      iconColor: 'text-[#204D9D]'
    },
    {
      icon: FaMobile,
      title: 'Mobile Marketing',
      description: 'We optimize your outreach for mobile devices, ensuring your message is accessible on smartphones and tablets.',
      color: 'from-[#306A64] to-[#4a8a82]',
      bgColor: 'bg-[#306A64]/5',
      iconColor: 'text-[#306A64]'
    }
  ];

  return (
    <section className='md:py-32 py-20 px-8 relative bg-white'>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#204D9D]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-[#306A64]/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className='max-w-[1200px] mx-auto relative z-10'>
        <div className='mb-20' data-aos="fade-up">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-[#204D9D] to-[#306A64] text-transparent bg-clip-text font-bold text-lg mb-4">
              OUR STRATEGY
            </div>
          </div>
          <div className='border-l-8 border-gradient-to-b from-[#204D9D] to-[#306A64] pl-8 pb-6 mb-8 relative'>
            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-[#204D9D] to-[#306A64] rounded-full"></div>
            <h2 className='font-extrabold md:text-5xl text-3xl text-[#000] leading-[1.1] mb-6 tracking-tight'>
              Our Approach to <span className="text-[#204D9D]">Multi-Channel Marketing</span>
            </h2>
          </div>
          <div className="max-w-[900px] space-y-6">
            <p className='text-gray-600 text-xl leading-relaxed font-light'>
              At Lead Fusion HQ, we don't believe in one-size-fits-all solutions. Every business is unique, and so are its marketing needs. That's why we begin by understanding your goals, target audience, and current market position. From there, we craft a customized multi-channel strategy that integrates various platforms seamlessly.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-3 h-3 bg-[#204D9D] rounded-full"></div>
              <p className='text-gray-700 text-xl font-semibold'>Our core channels include:</p>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {channels.map((channel, index) => {
            const IconComponent = channel.icon;
            return (
              <div 
                key={index}
                className='group bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-transparent relative overflow-hidden hover:-translate-y-2'
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${channel.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Floating icon background */}
                <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <IconComponent className="text-6xl" />
                </div>
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 ${channel.bgColor} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${channel.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <IconComponent className={`text-3xl ${channel.iconColor} group-hover:text-white transition-colors duration-500 relative z-10`} />
                  </div>
                  <h3 className='font-bold text-xl mb-6 text-[#000] group-hover:text-[#204D9D] transition-colors duration-500 leading-tight'>
                    {channel.title}
                  </h3>
                  <p className='text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300'>
                    {channel.description}
                  </p>
                </div>
                
                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


export default MultiChannelApproach;