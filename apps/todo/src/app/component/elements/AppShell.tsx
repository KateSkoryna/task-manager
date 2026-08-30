import { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import TopHeader from './TopHeader';
import Footer from './Footer';

function AppShell() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app">
      <TopHeader
        menuButtonRef={menuButtonRef}
        onOpenMenu={() => setDrawerOpen(true)}
        isMenuOpen={isDrawerOpen}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar className="hidden md:flex" />
        <MobileDrawer
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          triggerRef={menuButtonRef}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-content-mobile md:p-content-tablet lg:p-content-desktop">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default AppShell;
