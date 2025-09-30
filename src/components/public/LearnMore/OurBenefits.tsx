'use client';

import React from 'react';
import { 
  FaChartLine,
  FaBullseye,
  FaStar,
  FaSync,
  FaChartBar,
  FaPalette,
  FaLink,
  FaHandshake,

} from 'react-icons/fa';

function OurBenefits() {
  const benefits = [
    {
      number: '1',
      title: 'Increased Reach and Visibility',
      description: 'By diversifying your marketing efforts, we put your brand in front of prospects across multiple touchpoints. The more channels targeted, the higher the chances of capturing leads in different stages of the buyer cycle.',
      icon: FaChartLine,
      color: 'from-[#204D9D] to-[#2558b8]',
      accentColor: 'bg-[#204D9D]'
    },
    {
      number: '2',
      title: 'Consistent Branding',
      description: 'We ensure your messaging stays cohesive across platforms, creating a unified experience that builds trust and recognition.',
      icon: FaBullseye,
      color: 'from-[#306A64] to-[#4a8a82]',
      accentColor: 'bg-[#306A64]'
    },
    {
      number: '3',
      title: 'Better Lead Quality',
      description: 'Our data-driven strategies target the most relevant audiences, resulting in higher-quality leads that are more likely to convert into customers.',
      icon: FaStar,
      color: 'from-[#204D9D] to-[#2558b8]',
      accentColor: 'bg-[#204D9D]'
    },
    {
      number: '4',
      title: 'Higher Conversion Rates',
      description: 'Multi-channel campaigns reinforce your message and increase touchpoints, which statistically improves conversion rates compared to single-channel efforts.',
      icon: FaSync,
      color: 'from-[#306A64] to-[#4a8a82]',
      accentColor: 'bg-[#306A64]'
    },
    {
      number: '5',
      title: 'Measurable Results',
      description: 'We track, analyze, and optimize every channel to ensure your marketing budget is used effectively, and your ROI is maximized.',
      icon: FaChartBar,
      color: 'from-[#204D9D] to-[#2558b8]',
      accentColor: 'bg-[#204D9D]'
    }
  ];

  const whyChooseItems = [
    {
      title: 'Customized Campaigns',
      description: 'tailored to your specific industry, target audience, and goals.',
      icon: FaPalette,
      color: 'from-[#204D9D] to-[#2558b8]'
    },
    {
      title: 'Advanced Analytics',
      description: 'real-time data and reports to monitor results and adjust campaigns accordingly.',
      icon: FaChartLine,
      color: 'from-[#306A64] to-[#4a8a82]'
    },
    {
      title: 'Seamless Integration',
      description: 'coordinated efforts across channels for maximum impact without overlapping or confusing your prospects.',
      icon: FaLink,
      color: 'from-[#204D9D] to-[#2558b8]'
    },
    {
      title: 'Dedicated Support',
      description: 'a team of dedicated marketing professionals committed to your success.',
      icon: FaHandshake,
      color: 'from-[#306A64] to-[#4a8a82]'
    }
  ];

  return (
    <section className='md:py-32 py-20 px-8 bg-gradient-to-b from-gray-50 to-gray-100 relative'>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-2 h-32 bg-[#204D9D] rotate-45"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-24 bg-[#306A64] rotate-12"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-40 bg-[#204D9D] -rotate-12"></div>
      </div>
      
      <div className='max-w-[1200px] mx-auto relative z-10'>
        {/* Benefits Section */}
        <div className='mb-32'>
          <div className='mb-20' data-aos="fade-up">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-[#204D9D] to-[#306A64] text-transparent bg-clip-text font-bold text-lg mb-4">
                KEY ADVANTAGES
              </div>
            </div>
            <div className='border-l-8 border-gradient-to-b from-[#204D9D] to-[#306A64] pl-8 pb-6 mb-8 relative'>
              <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-[#204D9D] to-[#306A64] rounded-full"></div>
              <h2 className='font-extrabold md:text-5xl text-3xl text-[#000] leading-[1.1] tracking-tight'>
                The Benefits of Our <span className="text-[#204D9D]">Multi-Channel Approach</span>
              </h2>
            </div>
          </div>

          <div className='space-y-8'>
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div 
                  key={index}
                  className='group bg-white p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-transparent relative overflow-hidden'
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <div className='flex items-start gap-8 relative z-10'>
                    <div className='flex-shrink-0'>
                      <div className='relative'>
                        <div className={`w-20 h-20 ${benefit.accentColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                          <IconComponent className='text-3xl text-white relative z-10' />
                        </div>
                        <div className='text-center'>
                          <div className={`inline-flex items-center justify-center w-12 h-12 ${benefit.accentColor} rounded-full`}>
                            <span className='text-white font-bold text-xl'>{benefit.number}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-2xl mb-6 text-[#000] group-hover:text-[#204D9D] transition-colors duration-500'>
                        {benefit.title}
                      </h3>
                      <p className='text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors duration-300'>
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <IconComponent className="text-4xl text-[#204D9D]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Section */}
        <div>
          <div className='mb-20' data-aos="fade-up">
            <div className='border-l-8 border-gradient-to-b from-[#204D9D] to-[#306A64] pl-8 pb-6 mb-8 relative'>
              <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-[#204D9D] to-[#306A64] rounded-full"></div>
              <h2 className='font-extrabold md:text-5xl text-3xl text-[#000] leading-[1.1] tracking-tight'>
                Why Choose <span className="text-[#204D9D]">Lead Fusion HQ?</span>
              </h2>
            </div>
            <div className="space-y-6">
              <p className='text-gray-600 text-xl leading-relaxed font-light'>
                Our team of marketing experts brings years of experience in integrating multiple channels into a cohesive, effective lead generation system. We stay ahead of industry trends and technology, constantly refining our strategies to deliver superior results.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#204D9D] rounded-full"></div>
                <p className='text-gray-700 text-xl font-semibold'>
                  When you partner with Lead Fusion HQ, you gain access to:
                </p>
              </div>
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-8'>
            {whyChooseItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={index}
                  className='group bg-white p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-transparent relative overflow-hidden hover:-translate-y-1'
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <div className='flex items-start gap-6 relative z-10'>
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0 shadow-lg`}>
                      <IconComponent className='text-2xl text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-xl mb-4 text-[#000] group-hover:text-[#204D9D] transition-colors duration-500'>
                        {item.title}:
                      </h3>
                      <p className='text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors duration-300'>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-3xl"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OurBenefits;