import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';
import ChatPanel from '../agent/ChatPanel';

function AppShell() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app print:h-auto print:overflow-visible">
      <TopHeader className="print:hidden" />
      <div className="flex min-h-0 flex-1 overflow-hidden print:block print:overflow-visible">
        <Sidebar className="hidden md:flex print:hidden" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
          <main className="flex-1 overflow-y-auto pt-6 px-content-mobile pb-0 md:px-content-tablet md:pb-content-tablet lg:px-content-desktop lg:pb-content-desktop print:overflow-visible print:p-0">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </div>
      <ChatPanel />
    </div>
  );
}

export default AppShell;
