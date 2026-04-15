import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastOptions = Omit<ExternalToast, "type">;

export const appToast = {
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),

  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),

  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),

  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),
};
