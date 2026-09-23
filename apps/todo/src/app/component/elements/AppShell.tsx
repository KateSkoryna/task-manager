import { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import TopHeader from './TopHeader';
import Footer from './Footer';
import ChatPanel from '../agent/ChatPanel';

function AppShell() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app print:h-auto print:overflow-visible">
      <TopHeader
        menuButtonRef={menuButtonRef}
        onOpenMenu={() => setDrawerOpen(true)}
        isMenuOpen={isDrawerOpen}
        className="print:hidden"
      />
      <div className="flex min-h-0 flex-1 overflow-hidden print:block print:overflow-visible">
        <Sidebar className="hidden md:flex print:hidden" />
        <MobileDrawer
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          triggerRef={menuButtonRef}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
          <main className="flex-1 overflow-y-auto pt-3 px-content-mobile pb-content-mobile md:px-content-tablet md:pb-content-tablet lg:px-content-desktop lg:pb-content-desktop print:overflow-visible print:p-0">
            <Outlet />
          </main>
          <Footer className="print:hidden" />
        </div>
      </div>
      <ChatPanel />
    </div>
  );
}

export default AppShell;
