'use client';

import React, { useEffect, useState } from 'react';
import {
  AlignLeftIcon,
  ChevronDownIcon,
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
} from 'lucide-react';
import { navItems } from '../configs/constants';
import Link from 'next/link';
const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky
          ? 'fixed top-0 left-0 right-0 z-[100] bg-white shadow-lg'
          : 'relative'
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? 'pt-3' : 'pt-0'
        }`}
      >
        <div
          className={`w-[260px] ${
            isSticky && '-mb-2'
          } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff]`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeftIcon color="white" />
            <span className="text-white font-medium">All Departments</span>
          </div>
          <ChevronDownIcon color="white" />
        </div>
        {show && (
          <div
            className={`absolute left-0 ${
              isSticky ? 'top-[70px]' : 'top-[50px]'
            } w-[260px] h-[400px] bg-[#f5f5f5]`}
          ></div>
        )}
        <div className="flex items-center">
          {navItems.map((item, index) => (
            <Link
              className="px-5 font-medium text-lg"
              href={item.href}
              key={index}
            >
              {item.title}
            </Link>
          ))}
        </div>

        {isSticky && (
          <div className="flex items-center gap-8 pb-2">
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
              >
                <UserIcon />
              </Link>
              <Link href="/">
                <span className="black font-medium">Hello, </span>
                <span className="font-semibold">Sign In</span>
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/wishlist" className="relative">
                <HeartIcon />
                <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                  <span className="text-white font-medium text-sm">0</span>
                </div>
              </Link>
              <Link href="/cart" className="relative">
                <ShoppingCartIcon />
                <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                  <span className="text-white font-medium text-sm">0</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBottom;
