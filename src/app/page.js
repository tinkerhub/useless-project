'use client';

import FAQItem from '@/components/faq-item';
import { FAQS } from '@/constants/faqs';
import { Instrument_Serif } from 'next/font/google'
import Spline from '@splinetool/react-spline/next';

import { useMediaQuery } from '@react-hook/media-query';

const instrumentSerif = Instrument_Serif({  
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: '400',
  display: 'swap',
})

export default function Home() {

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className='main-content flex flex-col items-center justify-center min-h-screen bg-black'>
      <div className='landing-section flex items-center justify-center'>
        <Spline
          scene={ isMobile ? "https://prod.spline.design/YRn3OMA8L13xkp3U/scene.splinecode" : "https://prod.spline.design/J4Z0FRFvNiZvL-pq/scene.splinecode"} />
      </div>
      <div className='faq-section flex flex-col items-center justify-center gap-[36px] px-[20px] md:px-[32px] pt-[36px] md:pt-[64px] pb-[36px] md:pb-[160px]'>
        <span className={`section-title ${instrumentSerif.className} text-white italic text-[56px] font-normal -tracking-[0.02em]`}>FAQs</span>

        <ul className='faq-list flex flex-col max-w-[1000px] gap-[16px]'>
          {
            FAQS.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer} />
            ))
          }
        </ul>
      </div>
      <div className='footer-text flex items-center py-[36px]'>
        <span className='th-text font-light text-zinc-600 tracking-[0.075em] uppercase text-[12px] flex gap-[4px]'>
          From
          <a href="https://tinkerhub.org" target='_blank' className='font-semibold text-zinc-500'>TinkerHub</a>
        </span>
      </div>
    </div>
  );
}
