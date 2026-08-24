import SidebarContent from './SidebarContent';
import { mergeClassNames } from '../../lib/classNames';

type SidebarProps = {
  className?: string;
};

/** Persistent tablet/desktop navigation rail. Hidden on mobile — see MobileDrawer. */
function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={mergeClassNames(
        'h-full w-sidebar-tablet shrink-0 flex-col bg-sidebar lg:w-sidebar-desktop',
        className
      )}
    >
      <SidebarContent />
    </div>
  );
}

export default Sidebar;
