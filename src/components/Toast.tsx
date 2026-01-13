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

export function Toast({
  title,
  description,
  type = "info",
  open,
  onOpenChange,
}: ToastProps) {
  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-500"
      : type === "error"
      ? "bg-red-50 border-red-500"
      : "bg-blue-50 border-blue-500";

  const titleColor =
    type === "success"
      ? "text-green-900"
      : type === "error"
      ? "text-red-900"
      : "text-blue-900";

  const descriptionColor =
    type === "success"
      ? "text-green-700"
      : type === "error"
      ? "text-red-700"
      : "text-blue-700";

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        className={`${bgColor} border-l-4 rounded-lg shadow-lg p-4 max-w-sm`}
      >
        <ToastPrimitive.Title className={`${titleColor} font-semibold mb-1`}>
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className={`${descriptionColor} text-sm`}>
            {description}
          </ToastPrimitive.Description>
        )}
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[90vw]" />
    </ToastPrimitive.Provider>
  );
}
