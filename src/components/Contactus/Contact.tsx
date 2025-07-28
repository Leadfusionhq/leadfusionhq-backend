import React from 'react';
import Image from 'next/image'


export default function ContactSection() {
  return (
    <section className="md:py-28 py-12 px-8 bg-white text-center">
      <div className='Contact-us-box'>
      {/* Section Heading */}
      <h2 className="inline-block border-2 border-white bg-[#396C66] text-white px-6 py-2 rounded-md text-sm font-[18px]">
        CONTACT INFORMATION
      </h2>

      {/* Info Grid */}
      <div className=" contact-box-row mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
        {/* Email */}
        <div className="flex flex-col items-center py-8 md:py-14 ">
          <div className="">
          <Image src="/images/mail-icon.png" className='mb-6 max-w-[50px] max-h-[50px] object-contain' height={50} width={50} alt="Dashboard"/>
          </div>
          <p className='mb-1 font-bold md:text-[22px] text-[18px] text-[#1C1C1C]'>Email:</p>
          <p className="text-[18px] text-[#1C1C1C] font-medium">support@leadfusionhq.com</p>
        </div>

        {/* Phone */}
        <div className="flex flex-col items-center py-4 md:py-14 ">
          <div className="">
          <Image src="/images/call-icon.png" className='mb-6 max-w-[50px] max-h-[50px] object-contain' height={50} width={50} alt="Dashboard"/>
          </div>
          <p className='mb-1 font-bold md:text-[22px] text-[18px] text-[#1C1C1C]'>Call Us:</p>
          <p className="text-[18px] text-[#1C1C1C] font-medium">(123) 456-7890</p>
        </div>

        {/* Location */}
        <div className="flex flex-col items-center py-4 md:py-14  text-center">
          <div className="">
          <Image src="/images/loc-icon.png" className='mb-6 max-w-[50px] max-h-[50px] object-contain' height={50} width={50} alt="Dashboard"/>
          </div>
          <p className='mb-1 font-bold md:text-[22px] text-[18px] text-[#1C1C1C]'>Address:</p>
          <p className="text-[18px] text-[#1C1C1C] font-medium">
            525 NJ-73 Suite 104, Marlton,<br />NJ 08053
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}
