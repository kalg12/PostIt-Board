"use client";

import React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";

interface ToastProps {
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorConfig = {
  success: {
    bg: "bg-green-50 border-green-500",
    title: "text-green-900",
    description: "text-green-700",
  },
  error: {
    bg: "bg-red-50 border-red-500",
    title: "text-red-900",
    description: "text-red-700",
  },
  info: {
    bg: "bg-blue-50 border-blue-500",
    title: "text-blue-900",
    description: "text-blue-700",
  },
};

export function Toast({
  title,
  description,
  type = "info",
  open,
  onOpenChange,
}: ToastProps) {
  const colors = colorConfig[type];

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={`${colors.bg} border-l-4 rounded-lg shadow-lg p-4 max-w-sm`}
    >
      <ToastPrimitive.Title className={`${colors.title} font-semibold mb-1`}>
        {title}
      </ToastPrimitive.Title>
      {description && (
        <ToastPrimitive.Description className={`${colors.description} text-sm`}>
          {description}
        </ToastPrimitive.Description>
      )}
    </ToastPrimitive.Root>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[90vw]" />
    </ToastPrimitive.Provider>
  );
}
