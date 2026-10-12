import {
  LayoutDashboard,
  Flame,
  ListTodo,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/vital', labelKey: 'nav.vitalTasks', icon: Flame, end: false },
  {
    to: '/tasks',
    labelKey: 'nav.myTasks',
    icon: ListTodo,
    end: false,
    tourId: 'my-tasks-link',
  },
  {
    to: '/statistics',
    labelKey: 'nav.statistics',
    icon: BarChart2,
    end: false,
    tourId: 'statistics-link',
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
