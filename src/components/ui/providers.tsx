"use client";

import { ConfirmProvider } from "./confirm";
import { ToastProvider } from "./toast";

export function UiProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
