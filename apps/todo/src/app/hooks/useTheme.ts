import { create } from 'zustand';

export type Theme = 'light' | 'dark';

// Must match the inline theme-init script in apps/todo/src/index.html.
const STORAGE_KEY = 'todo-theme';

function readAppliedTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/** Single source of truth for the light/dark theme, backed by localStorage. */
export const useThemeStore = create<ThemeState>((set) => ({
  theme: readAppliedTheme(),
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Best-effort persistence: a full/blocked storage still applies the
      // theme for this session, it just won't survive a reload.
    }
  },
}));

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  return { theme, setTheme };
}
