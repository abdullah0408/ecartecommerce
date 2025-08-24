'use client';

import React, { useEffect } from 'react';
import useSidebar from '../../hooks/useSidebar';
import { usePathname } from 'next/navigation';
import useSeller from '../../hooks/useSeller';
import Box from '../Box';
import { Sidebar as SidebarStyled } from './sidebarStyles';
import Link from 'next/link';
import {
  BellIcon,
  BellRingIcon,
  CalendarPlusIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOutIcon,
  MailIcon,
  PackageSearchIcon,
  PlusSquareIcon,
  SettingsIcon,
  TicketPercentIcon,
  WalletIcon,
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import SidebarMenu from './sidebarMenu';
import Image from 'next/image';

const Sidebar = () => {
  const { activeSidebarItem, setActiveSidebarItem } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();

  useEffect(() => {
    setActiveSidebarItem(pathName);
  }, [pathName, setActiveSidebarItem]);

  const getIconColor = (route: string) => {
    if (route === '/log-out') {
      return activeSidebarItem === route ? '#ef4444' : '#969696';
    }
    return activeSidebarItem === route ? '#0085ff' : '#969696';
  };

  return (
    <Box
      css={{
        height: '100vh',
        zIndex: 202,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
      }}
      className="sidebar-wrapper"
    >
      <SidebarStyled.Header>
        <Box>
          <Link href="/" className="flex items-center gap-3 p-2">
            <Image
              src="/logo.png"
              alt="Shop Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <Box className="flex flex-col">
              {seller?.shop?.name ? (
                <h3 className="text-xl font-medium text-[#ecedee]">
                  {seller.shop.name}
                </h3>
              ) : (
                <h3 className="text-xl font-medium text-[#9ca3af]">
                  Loading Shop...
                </h3>
              )}
              {seller?.shop?.address ? (
                <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">
                  {seller.shop.address}
                </h5>
              ) : (
                <h5 className="font-medium text-xs text-[#6b7280]">
                  Loading address...
                </h5>
              )}
            </Box>
          </Link>
        </Box>
      </SidebarStyled.Header>
      <div className="flex-1 overflow-y-auto my-3 scrollbar-hide">
        <SidebarStyled.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={
              <LayoutDashboardIcon
                size={24}
                color={getIconColor('/dashboard')}
                strokeWidth={2}
              />
            }
            isActive={activeSidebarItem === '/dashboard'}
            href="/dashboard"
          />
          <div className="mt-2 block">
            <SidebarMenu title="Main Menu">
              <SidebarItem
                title="Orders"
                icon={
                  <ListOrderedIcon
                    size={24}
                    color={getIconColor('/dashboard/orders')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/orders'}
                href="/dashboard/orders"
              />
              <SidebarItem
                title="Payments"
                icon={
                  <WalletIcon
                    size={24}
                    color={getIconColor('/dashboard/payments')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/payments'}
                href="/dashboard/payments"
              />
            </SidebarMenu>
            <SidebarMenu title="Products">
              <SidebarItem
                title="Create Product"
                icon={
                  <PlusSquareIcon
                    size={24}
                    color={getIconColor('/dashboard/create-product')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/create-product'}
                href="/dashboard/create-product"
              />
              <SidebarItem
                title="All Products"
                icon={
                  <PackageSearchIcon
                    size={24}
                    color={getIconColor('/dashboard/all-products')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/all-products'}
                href="/dashboard/all-products"
              />
            </SidebarMenu>
            <SidebarMenu title="Events">
              <SidebarItem
                title="Create Event"
                icon={
                  <CalendarPlusIcon
                    size={24}
                    color={getIconColor('/dashboard/create-event')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/create-event'}
                href="/dashboard/create-event"
              />
              <SidebarItem
                title="All Events"
                icon={
                  <BellIcon
                    size={24}
                    color={getIconColor('/dashboard/all-events')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/all-events'}
                href="/dashboard/all-events"
              />
            </SidebarMenu>
            <SidebarMenu title="Controllers">
              <SidebarItem
                title="Inbox"
                icon={
                  <MailIcon
                    size={24}
                    color={getIconColor('/dashboard/inbox')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/inbox'}
                href="/dashboard/inbox"
              />
              <SidebarItem
                title="Settings"
                icon={
                  <SettingsIcon
                    size={24}
                    color={getIconColor('/dashboard/settings')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/settings'}
                href="/dashboard/settings"
              />
              <SidebarItem
                title="Notifications"
                icon={
                  <BellRingIcon
                    size={24}
                    color={getIconColor('/dashboard/notifications')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/notifications'}
                href="/dashboard/notifications"
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              <SidebarItem
                title="Discount Codes"
                icon={
                  <TicketPercentIcon
                    size={24}
                    color={getIconColor('/dashboard/discount-codes')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/dashboard/discount-codes'}
                href="/dashboard/discount-codes"
              />
              <SidebarItem
                title="Log Out"
                icon={
                  <LogOutIcon
                    size={24}
                    color={getIconColor('/log-out')}
                    strokeWidth={2}
                  />
                }
                isActive={activeSidebarItem === '/log-out'}
                href="/log-out"
              />
            </SidebarMenu>
          </div>
        </SidebarStyled.Body>
      </div>
    </Box>
  );
};

export default Sidebar;
