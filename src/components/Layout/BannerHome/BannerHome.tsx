'use client';

import React from 'react';

interface BannerHomeProps {
  title: string;
  description: string;
  buttonText?: string;
  backgroundImage?: string;
}

function BannerHome({
  title,
  description,
  buttonText,
  backgroundImage = '/images/home-banner.png',
}: BannerHomeProps) {
  return (
    <section
      style={{ backgroundImage: `url(${backgroundImage})` }}
      className="bg-no-repeat bg-cover py-16 px-8 flex items-center justify-center min-h-[85vh]"
    >
      <div className="max-w-[1200px] mx-auto" data-aos="fade-right">
        <h1 className="text-white md:max-w-[50%] mb-4 text-5xl">{title}</h1>
        <p className="text-white md:max-w-[60%] mb-4 text-lg font-light">
          {description}
        </p>
        {buttonText && (
          <button className="bg-white border border-[#fff] px-6 py-3 text-[#000] rounded-[6px] hover:bg-[transparent] duration-300 hover:text-[#fff]">
            {buttonText}
          </button>
        )}
      </div>
    </section>
  );
}

export default BannerHome;
