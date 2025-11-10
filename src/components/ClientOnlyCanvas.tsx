"use client";

import dynamic from "next/dynamic";

// Importar CanvasBoard dinámicamente sin SSR para evitar problemas de hidratación
const CanvasBoard = dynamic(() => import("./CanvasBoard"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Cargando lienzo interactivo...</p>
      </div>
    </div>
  ),
});

export default function ClientOnlyCanvas() {
  return <CanvasBoard />;
}
