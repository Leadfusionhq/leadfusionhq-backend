'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FaChartLine,
  FaBullseye,
  FaHandshake,
  FaRocket,
  FaLightbulb,
  FaUsers,
} from 'react-icons/fa';

function LearnMoreCta() {
  return (
    <section className='md:py-32 py-20 px-8 relative bg-white overflow-hidden'>
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-[#204D9D]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-64 h-64 bg-[#306A64]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#204D9D]/3 to-[#306A64]/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className='max-w-[1200px] mx-auto relative z-10'>
        {/* Main CTA Section */}
        <div className='relative bg-gradient-to-br from-[#204D9D] via-[#2558b8] to-[#306A64] rounded-[40px] p-12 md:p-20 text-center overflow-hidden' data-aos="fade-up">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-16 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
          </div>
          
          {/* Floating icons */}
          <div className="absolute top-8 left-8 animate-bounce delay-100">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FaRocket className="text-white text-lg" />
            </div>
          </div>
          <div className="absolute top-12 right-12 animate-bounce delay-500">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <FaLightbulb className="text-white text-sm" />
            </div>
          </div>
          <div className="absolute bottom-8 left-16 animate-bounce delay-700">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FaBullseye className="text-white text-xl" />
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-8 py-3 mb-8">
              <span className="text-white/90 font-semibold">🚀 Ready to Transform Your Business?</span>
            </div>
            <h2 className='text-white font-extrabold md:text-5xl text-3xl mb-8 leading-[1.1] tracking-tight'>
              Ready to Expand Your Reach and <span className="text-yellow-300">Grow Your Business?</span>
            </h2>
            <p className='text-white/95 text-xl mb-12 max-w-[800px] mx-auto leading-relaxed font-light'>
              Multi-channel marketing isn&apos;t just a trend; it&apos;s the future of lead generation. 
              By adopting a comprehensive approach, you can unlock new opportunities, attract more qualified leads, 
              and achieve sustainable growth.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                <FaChartLine className="text-yellow-300 text-lg" />
                <span className="text-white font-medium">Proven Results</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                <FaBullseye className="text-yellow-300 text-lg" />
                <span className="text-white font-medium">Targeted Approach</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                <FaHandshake className="text-yellow-300 text-lg" />
                <span className="text-white font-medium">Expert Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Information */}
        <div className='mt-24 grid md:grid-cols-3 gap-10' data-aos="fade-up">
          <div className='text-center group'>
            <div className='w-20 h-20 bg-gradient-to-br from-[#204D9D] to-[#2558b8] rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg'>
              <FaRocket className='text-3xl text-white' />
            </div>
            <h3 className='font-bold text-2xl mb-4 group-hover:text-[#204D9D] transition-colors duration-300'>Scalable Solutions</h3>
            <p className='text-gray-600 text-lg leading-relaxed'>
              Whether you&apos;re a small local business or a large enterprise, our strategies are flexible 
              and scalable to meet your needs.
            </p>
          </div>

          <div className='text-center group'>
            <div className='w-20 h-20 bg-gradient-to-br from-[#306A64] to-[#4a8a82] rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg'>
              <FaLightbulb className='text-3xl text-white' />
            </div>
            <h3 className='font-bold text-2xl mb-4 group-hover:text-[#306A64] transition-colors duration-300'>Innovation Driven</h3>
            <p className='text-gray-600 text-lg leading-relaxed'>
              We stay ahead of industry trends and technology, constantly refining our strategies 
              to deliver superior results.
            </p>
          </div>

          <div className='text-center group'>
            <div className='w-20 h-20 bg-gradient-to-br from-[#204D9D] to-[#2558b8] rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg'>
              <FaBullseye className='text-3xl text-white' />
            </div>
            <h3 className='font-bold text-2xl mb-4 group-hover:text-[#204D9D] transition-colors duration-300'>Results Focused</h3>
            <p className='text-gray-600 text-lg leading-relaxed'>
              At Lead Fusion HQ, we&apos;re passionate about helping businesses harness the full potential 
              of digital marketing for measurable growth.
            </p>
          </div>
        </div>

        {/* Final Message */}
        <div className='mt-24 text-center relative' data-aos="fade-up">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent rounded-3xl"></div>
          <div className="relative z-10 py-16 px-8">
            <div className="inline-block bg-[#204D9D]/10 rounded-full px-8 py-3 mb-6">
              <span className="text-[#204D9D] font-semibold">Don&apos;t Wait - Act Now</span>
            </div>
            <h3 className='font-extrabold md:text-4xl text-2xl text-[#000] mb-6 tracking-tight'>
              Don&apos;t Leave Your Success to <span className="text-[#204D9D]">Chance</span>
            </h3>
            <p className='text-gray-600 max-w-[700px] mx-auto text-xl leading-relaxed font-light'>
              Take control of your marketing today. Contact us to learn more about how our 
              multi-channel marketing solutions can transform your lead generation efforts 
              and drive the growth your business deserves.
            </p>
            
            {/* Call to action badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <div className="flex items-center space-x-2 bg-[#204D9D]/10 rounded-full px-6 py-3">
                <FaUsers className="text-[#204D9D]" />
                <span className="text-[#204D9D] font-medium">Expert Team</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#306A64]/10 rounded-full px-6 py-3">
                <FaChartLine className="text-[#306A64]" />
                <span className="text-[#306A64] font-medium">Proven Growth</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#204D9D]/10 rounded-full px-6 py-3">
                <FaHandshake className="text-[#204D9D]" />
                <span className="text-[#204D9D] font-medium">Partnership Focus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LearnMoreCta;