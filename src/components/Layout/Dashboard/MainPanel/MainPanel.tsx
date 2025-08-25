'use client';
import Image from 'next/image';
import { useEffect, PropsWithChildren } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { collapseSidebar, toggleAutoCollapse } from '@/redux/theme/theme_slice';
import { RootState } from '@/redux/store';
import Topbar from '../Topbar/Topbar';

const MainPanel = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();
  const collapsed = useSelector((state: RootState) => state.theme.collapsed);
  const autoCollapsed = useSelector((state: RootState) => state.theme.autoCollapsed);

  useEffect(() => {
    const handleResize = () => {
      dispatch(collapseSidebar(false));
      dispatch(toggleAutoCollapse(false));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch]);

  return (
    <div className={`main-panel sticky top-0 w-full   z-9 lg:z-9  ${collapsed || autoCollapsed ? 'full-width-panel' : ''}`}>
      {/* Sticky Topbar */}
  <div className="w-full ">
    <Topbar />
  </div>

  {/* Scrollable Content */}
  {/* <div className="main-content-wrapper flex-1 overflow-y-auto">
    {children}
  </div> */}
    </div>
  );
};

export default MainPanel;
