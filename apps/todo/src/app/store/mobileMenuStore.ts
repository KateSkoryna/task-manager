import { create } from 'zustand';

interface MobileMenuState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

/** Whether the phone navigation drawer is open; shared so the tour can open it. */
export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
}));
