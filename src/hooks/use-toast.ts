
import { useState, useEffect, useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive" | "success" | "warning";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

const useToast = () => {
  const toast = useCallback(
    ({ title, description, variant = "default", duration = 5000, action }: ToastProps) => {
      const toastOptions = {
        duration,
        action,
      };

      switch (variant) {
        case "destructive":
          return sonnerToast.error(title || "Error", {
            description,
            ...toastOptions,
          });
        case "success":
          return sonnerToast.success(title || "Success", {
            description,
            ...toastOptions,
          });
        case "warning":
          return sonnerToast.warning(title || "Warning", {
            description,
            ...toastOptions,
          });
        default:
          return sonnerToast(title || "Notification", {
            description,
            ...toastOptions,
          });
      }
    },
    []
  );

  return { toast };
};

// Create a standalone toast function for use outside of React components
const toast = (props: ToastProps) => {
  const { title, description, variant = "default", duration = 5000, action } = props;

  const toastOptions = {
    duration,
    action,
  };

  switch (variant) {
    case "destructive":
      return sonnerToast.error(title || "Error", {
        description,
        ...toastOptions,
      });
    case "success":
      return sonnerToast.success(title || "Success", {
        description,
        ...toastOptions,
      });
    case "warning":
      return sonnerToast.warning(title || "Warning", {
        description,
        ...toastOptions,
      });
    default:
      return sonnerToast(title || "Notification", {
        description,
        ...toastOptions,
      });
  }
};

export { useToast, toast };
