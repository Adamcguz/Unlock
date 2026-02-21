import { Outlet } from 'react-router';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh">
      <TopBar />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
