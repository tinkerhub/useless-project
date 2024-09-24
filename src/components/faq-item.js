'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQItem({
  question,
  answer
}) {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={() => setIsOpen(!isOpen)} 
      className={`faq-item flex flex-col overflow-hidden cursor-pointer border px-[18px] py-[16px] border-[#2C2C2C] bg-[#1E1E1E] rounded-[8px] transition-all duration-200 ${isOpen ? 'gap-[8px]' : 'gap-0'}`}>
      <div className='title-container flex items-center justify-between text-[#FAFAFA] gap-[8px]'>
        <span className='question text-[15px] font-semibold'>{question}</span>
        <ChevronDown className={`dropdown-icon size-[20px] transition-all duration-200 ${isOpen && 'rotate-180'}`} />
      </div>
      <span className={`answer text-[15px] font-normal text-[#b3b3b3] transition-all duration-100 ${isOpen ? 'opacity-1 max-h-auto' : 'opacity-0 max-h-0 invisible'}`}>
        {answer}
      </span>
    </div>
  )

}