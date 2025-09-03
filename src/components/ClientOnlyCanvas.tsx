"use client";

import React, { useState, useEffect } from "react";

export default function ClientOnlyCanvas() {
  const [CanvasBoard, setCanvasBoard] = useState<React.ComponentType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Solo cargar el componente en el cliente
    const loadCanvas = async () => {
      try {
        const { default: Canvas } = await import("./CanvasBoard");
        setCanvasBoard(() => Canvas);
      } catch (error) {
        console.error("Error loading canvas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvas();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            Cargando lienzo interactivo...
          </p>
        </div>
      </div>
    );
  }

  if (!CanvasBoard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-red-600">Error al cargar el lienzo</p>
        </div>
      </div>
    );
  }

  return <CanvasBoard />;
}
