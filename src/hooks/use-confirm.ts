"use client";

import { useState } from "react";

type ConfirmType = "danger" | "warning" | "info" | "primary" | "success";

export type ConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmType;
  onConfirm: () => void | Promise<void>;
};

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  function askConfirm(config: ConfirmState) {
    setConfirmState(config);
  }

  function closeConfirm() {
    if (isConfirming) return;
    setConfirmState(null);
  }

  async function handleConfirm() {
    if (!confirmState) return;

    try {
      setIsConfirming(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setIsConfirming(false);
    }
  }

  return {
    confirmState,
    isConfirming,
    askConfirm,
    closeConfirm,
    handleConfirm,
  };
}
