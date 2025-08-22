import Link from 'next/link';
import React from 'react';

const SidebarItem = ({
  icon,
  title,
  isActive,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href: string;
}) => {
  const isLogout = href === '/log-out';

  return (
    <Link href={href} className="my-2 block">
      <div
        className={`flex gap-2 w-full min-h-12 h-full items-center px-[13px] rounded-lg cursor-pointer transition-all duration-200 ${
          isLogout
            ? 'hover:bg-red-500/20 hover:scale-[.98] active:scale-[.95]'
            : isActive
            ? 'scale-[.98] bg-[#0f3158] hover:bg-[#0f3158d6]'
            : 'hover:bg-[#2b2f31]'
        }`}
      >
        {icon}
        <h5
          className={`text-lg transition-colors ${
            isLogout
              ? 'text-slate-200 font-medium'
              : isActive
              ? 'text-white'
              : 'text-slate-200'
          }`}
        >
          {title}
        </h5>
      </div>
    </Link>
  );
};

export default SidebarItem;
