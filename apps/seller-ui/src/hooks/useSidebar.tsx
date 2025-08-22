'use client';

import { useAtom } from 'jotai';
import { activeSidebarItem as _activeSidebarItem } from '../configs/activeSidebarItem';

const useSidebar = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useAtom(_activeSidebarItem);
  return { activeSidebarItem, setActiveSidebarItem };
};

export default useSidebar;
