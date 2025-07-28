'use client';  

import React from 'react'
import Image from 'next/image'
import Link from 'next/link';




function Footer() {
  return (
        <section className='bg-[#000] px-4'>
            <div className='flex md:flex-row flex-col justify-between md:gap-16 gap-6 max-w-[1200px] mx-auto py-16'>
                <div className='md:w-[35%] w-full'>
                    <Link href="/">
                    <Image src="/images/footer-logo.png" alt="Logo" height={200} width={200} className='w-[120px]'/>
                    </Link>
                    <p className='text-white mt-4 font-light text-sm'>{`At Lead Fusion, we've engineered every part of our platform to help  companies win — from the moment a lead comes in, to the final closed deal.`}</p>
                </div>
                <div className='md:w-[20%] w-full md:space-y-4 space-y-2'>
                    <p className='text-white text-xl font-bold'>Quick Links</p>
                    <Link href="/login" className='text-white block font-light text-sm cusrsor-pointer'>Login</Link>
                    <Link href="/register" className='text-white block font-light text-sm cusrsor-pointer'>Signup </Link>
                    <Link href="/term-of-service" className='text-white block font-light text-sm cusrsor-pointer'>Terms of Service</Link>
                    <Link href="/privacy-policy" className='text-white block font-light text-sm cusrsor-pointer'>Privacy Policy</Link>
                </div>
                <div className='md:w-[20%] w-full md:space-y-4 space-y-2'>
                    <p className='text-white text-xl font-bold'>Follow on</p>
                    <div className='text-white flex gap-3 items-center font-light'>
                        <Image src="/images/icons/f-facebook.png" alt="Facebook" className='max-w-[15px] max-h-[15px] object-contain' height={20} width={20}/>
                        <p className='font-light text-sm'>Facebook</p>
                    </div>
                    <div className='text-white flex gap-3 items-center font-light'>
                        <Image src="/images/icons/f-twitter.png" alt="Twitter" className='max-w-[15px] max-h-[15px] object-contain' height={20} width={20}/>
                        <p className='font-light text-sm'>Twitter</p>
                    </div>
                    <div className='text-white flex gap-3 items-center font-light'>
                        <Image src="/images/icons/f-insta.png" alt="Instagram" className='max-w-[15px] max-h-[15px] object-contain' height={20} width={20}/>
                        <p className='font-light text-sm'>Instagram</p>
                    </div>
                </div>
                <div className='md:w-[25%] w-full md:space-y-4 space-y-2'>
                    <p className='text-white text-xl font-bold'>Contact Us</p>
                    <p className='text-white font-extralight text-sm'>{`Whether you're looking for more information or ready to get started, we're here to support you with quick answers and real solutions.`}</p>
                    <Link href="/contact-us" passHref>
      <button className="bg-white hover:bg-transparent hover:text-[#fff] border border-[#fff] duration-300 px-4 py-2 text-sm text-[#000] rounded-[6px]">
        Contact Us
      </button>
    </Link>                </div>
            </div>
            <div className='flex justify-between gap-8items-center max-w-[1200px] mx-auto py-6 border-t border-[#ffffff4D]'>
                <div>
                    <p className='text-white font-light text-sm'>© 2025 Lead Fusion, All Rights Reserved.</p>
                </div>
                <div className='flex items-center gap-2 justify-between'>
                    <Link href='#top' className='flex items-center gap-2 justify-between'>
                        <p className='text-white text-sm'>Back to top</p>
                        <Image src="/images/icons/top.png" alt="Top" height={15} width={15}/>
                    </Link>
                </div>
            </div>
        </section>
  )
}

export default Footer