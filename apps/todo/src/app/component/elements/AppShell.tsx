import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app">
      <TopHeader />
      <div className="flex flex-1 min-h-0 overflow-hidden pt-8">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
