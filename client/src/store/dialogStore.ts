import { create } from 'zustand';

export type DialogType = 'info' | 'success' | 'warning' | 'error';
export type ConfirmType = 'danger' | 'warning' | 'info';

interface AlertOptions {
  title?: string;
  message: string;
  type?: DialogType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface DialogState {
  // Alert State
  isAlertOpen: boolean;
  alertOptions: AlertOptions | null;
  alertResolver: (() => void) | null;

  // Confirm State
  isConfirmOpen: boolean;
  confirmOptions: ConfirmOptions | null;
  confirmResolver: ((value: boolean) => void) | null;

  // Actions
  showAlert: (options: AlertOptions | string) => Promise<void>;
  closeAlert: () => void;

  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isAlertOpen: false,
  alertOptions: null,
  alertResolver: null,

  isConfirmOpen: false,
  confirmOptions: null,
  confirmResolver: null,

  showAlert: (options) => {
    return new Promise((resolve) => {
      const parsedOptions = typeof options === 'string' ? { message: options } : options;
      set({
        isAlertOpen: true,
        alertOptions: parsedOptions,
        alertResolver: resolve,
      });
    });
  },

  closeAlert: () => {
    const { alertResolver } = get();
    if (alertResolver) alertResolver();
    set({ isAlertOpen: false, alertOptions: null, alertResolver: null });
  },

  showConfirm: (options) => {
    return new Promise((resolve) => {
      const parsedOptions = typeof options === 'string' ? { message: options } : options;
      set({
        isConfirmOpen: true,
        confirmOptions: parsedOptions,
        confirmResolver: resolve,
      });
    });
  },

  closeConfirm: (result) => {
    const { confirmResolver } = get();
    if (confirmResolver) confirmResolver(result);
    set({ isConfirmOpen: false, confirmOptions: null, confirmResolver: null });
  },
}));
