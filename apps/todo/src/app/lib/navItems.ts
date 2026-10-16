import {
  LayoutDashboard,
  Flame,
  ListTodo,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';

// `inTabBar` marks the pages shown in the phone tab bar; the rest go behind
// "More". Every menu is built from this one list, in this order.
export const NAV_ITEMS = [
  {
    to: '/',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    end: true,
    inTabBar: true,
  },
  {
    to: '/vital',
    labelKey: 'nav.vitalTasks',
    icon: Flame,
    end: false,
    inTabBar: true,
  },
  {
    to: '/tasks',
    labelKey: 'nav.myTasks',
    icon: ListTodo,
    end: false,
    tourId: 'my-tasks-link',
    inTabBar: true,
  },
  {
    to: '/statistics',
    labelKey: 'nav.statistics',
    icon: BarChart2,
    end: false,
    tourId: 'statistics-link',
    inTabBar: true,
  },
  { to: '/reports', labelKey: 'nav.reports', icon: FileText, end: false },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    end: false,
    tourId: 'settings-link',
  },
  { to: '/help', labelKey: 'nav.help', icon: HelpCircle, end: false },
];
