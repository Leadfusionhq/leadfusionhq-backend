import React from 'react'
import Link from "next/link";

function WhyChoose() {
  return (
    <section className='md:py-28 py-12 px-8'>
        <div className='max-w-[1200px] mx-auto flex md:flex-row flex-col gap-10 items-end'>
            <div className='md:w-1/2 w-full' data-aos="fade-right">
                <div className='border-l-4 border-[#204D9D] pl-6 pb-3'>
                    <h6 className='mb-3 font-bold text-sm primary-color'>Why Choose us</h6>
                    <h3 className='font-bold md:text-5xl text-2xl text-[#000] leading-[1.2]'>Built for Growth — From Lead to Close</h3>
                </div>          
                <p className='font-light mb-4 ml-6'>{`At Lead Fusion, we've engineered every part of our platform to help  companies win — from the moment a lead comes in, to the final closed deal. Whether you're managing a sales team or scaling across markets, our tools give you total visibility, faster follow-up, and smarter conversions.`} </p>
                <p className='font-light mb-4 ml-6'>We deliver leads, a powerful lead management dashboard, and dedicated support every step of the way — so you can focus on growing your  business with confidence.</p>
                <Link href={'/learn-more'}>
                <button className='bg-black border border-[#000] hover:bg-transparent hover:text-[#000] duration-300 mt-6 px-6 py-3 text-[#fff] rounded-[6px] ml-6'>LEARN MORE</button>
                </Link>
            </div>
            <div className='flex md:flex-row flex-col gap-4 md:w-1/2 w-full'>
                <div className='md:w-[33%] w-full'>
                    <div className='group rounded-[5px] py-6 px-3 bg-[#306A640A] h-full hover:bg-[#306A64] transition-all duration-300' data-aos="fade-in">
                        <p className='font-bold text-4xl text-[#000] group-hover:text-white transition-colors duration-300'>1000+</p>
                        <span className='w-[30px] h-[4px] inline-block bg-[#204D9D] group-hover:w-[20px] group-hover:bg-[#fff] mt-0 group-hover:mt-2 transition-all duration-300'></span>
                        <p className='font-bold text-lg mt-6 max-w-[80%] text-[#000] group-hover:text-white transition-colors duration-300'>Leads Delivered</p>
                    </div>
                </div>
                <div className='md:w-[33%] w-full'>
                     <div className='group rounded-[5px] py-6 px-3 bg-[#306A640A] h-full hover:bg-[#306A64] transition-all duration-300' data-aos="fade-in">
                        <p className='font-bold text-4xl text-[#000] group-hover:text-white transition-colors duration-300'>300+</p>
                        <span className='w-[30px] h-[4px] inline-block bg-[#204D9D] group-hover:w-[20px] group-hover:bg-[#fff] mt-0 group-hover:mt-2 transition-all duration-300'></span>
                        <p className='font-bold text-lg mt-6 max-w-[80%] text-[#000] group-hover:text-white transition-colors duration-300'>Projects Completed</p>
                    </div>
                </div>
                <div className='md:w-[33%] w-full'>
                    <div className='group rounded-[5px] py-6 px-3 bg-[#306A640A] h-full hover:bg-[#306A64] transition-all duration-300' data-aos="fade-in">
                        <p className='font-bold text-4xl text-[#000] group-hover:text-white transition-colors duration-300'>15+</p>
                        <span className='w-[30px] h-[4px] inline-block bg-[#204D9D] group-hover:w-[20px] group-hover:bg-[#fff] mt-0 group-hover:mt-2 transition-all duration-300'></span>
                        <p className='font-bold text-lg mt-6 max-w-[80%] text-[#000] group-hover:text-white transition-colors duration-300'>Years Experiences</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
  )
}

export default WhyChoose