"use client";

import React from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportX: number;
  viewportY: number;
  scale: number;
  posts: Array<{ x: number; y: number; color: string }>;
  onViewportChange: (x: number, y: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export default function Minimap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
  scale,
  posts,
  onViewportChange,
  onZoomIn,
  onZoomOut,
  onResetView,
}: MinimapProps) {
  const minimapWidth = 200;
  const minimapHeight = 150;
  const scaleX = minimapWidth / canvasWidth;
  const scaleY = minimapHeight / canvasHeight;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convertir coordenadas del minimapa a coordenadas del canvas
    const canvasX = clickX / scaleX;
    const canvasY = clickY / scaleY;

    // Centrar el viewport en el punto clickeado
    const newViewportX = canvasX - viewportWidth / (2 * scale);
    const newViewportY = canvasY - viewportHeight / (2 * scale);

    onViewportChange(newViewportX, newViewportY);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50">
      {/* Controles de zoom */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Alejar"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="text-sm font-medium min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Acercar"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          onClick={onResetView}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Restablecer vista"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Minimapa */}
      <div className="relative border rounded">
        <div
          className="relative bg-gray-50 cursor-pointer"
          style={{
            width: minimapWidth,
            height: minimapHeight,
          }}
          onClick={handleMinimapClick}
        >
          {/* Posts en el minimapa */}
          {posts.map((post, index) => (
            <div
              key={index}
              className="absolute rounded-sm"
              style={{
                left: post.x * scaleX - 2,
                top: post.y * scaleY - 2,
                width: 4,
                height: 4,
                backgroundColor: post.color,
                border: "1px solid rgba(0,0,0,0.2)",
              }}
            />
          ))}

          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
            style={{
              left: Math.max(0, viewportX * scaleX),
              top: Math.max(0, viewportY * scaleY),
              width: Math.min(
                minimapWidth - Math.max(0, viewportX * scaleX),
                (viewportWidth / scale) * scaleX
              ),
              height: Math.min(
                minimapHeight - Math.max(0, viewportY * scaleY),
                (viewportHeight / scale) * scaleY
              ),
            }}
          />
        </div>

        <div className="text-xs text-gray-500 mt-1 text-center">
          Minimapa - Click para navegar
        </div>
      </div>
    </div>
  );
}
