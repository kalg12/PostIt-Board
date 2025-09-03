"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Eye, EyeOff } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPosts, setShowPosts] = useState(true);

  const minimapWidth = isExpanded ? 280 : 200;
  const minimapHeight = isExpanded ? 200 : 120;
  const scaleX = minimapWidth / canvasWidth;
  const scaleY = minimapHeight / canvasHeight;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convertir coordenadas del minimapa a coordenadas del canvas
    const canvasX = clickX / scaleX;
    const canvasY = clickY / scaleY;

    // Centrar el viewport en el punto clickeado (invertir la lógica)
    const newViewportX = -(canvasX - viewportWidth / (2 * scale));
    const newViewportY = -(canvasY - viewportHeight / (2 * scale));

    onViewportChange(newViewportX, newViewportY);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Solo si se está arrastrando con botón izquierdo

    const rect = e.currentTarget.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const dragY = e.clientY - rect.top;

    // Convertir a coordenadas del canvas
    const canvasX = dragX / scaleX;
    const canvasY = dragY / scaleY;

    // Centrar el viewport (invertir la lógica)
    const newViewportX = -(canvasX - viewportWidth / (2 * scale));
    const newViewportY = -(canvasY - viewportHeight / (2 * scale));

    onViewportChange(newViewportX, newViewportY);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300">
      {/* Header con controles */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">
            Navegación
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowPosts(!showPosts)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title={showPosts ? "Ocultar posts" : "Mostrar posts"}
          >
            {showPosts ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title={isExpanded ? "Minimizar" : "Expandir"}
          >
            <div
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4l-4 4h3v4h2V8h3L8 4z" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Controles de zoom */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onZoomOut}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onResetView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Vista inicial"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Minimapa */}
      <div className="p-3">
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
          <div
            className="relative cursor-crosshair select-none"
            style={{
              width: minimapWidth,
              height: minimapHeight,
            }}
            onClick={handleMinimapClick}
            onMouseMove={handleDrag}
          >
            {/* Grid de fondo */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Posts en el minimapa */}
            {showPosts &&
              posts.map((post, index) => (
                <div
                  key={index}
                  className="absolute rounded-full shadow-sm border border-white/50"
                  style={{
                    left: post.x * scaleX - 3,
                    top: post.y * scaleY - 3,
                    width: 6,
                    height: 6,
                    backgroundColor: post.color,
                  }}
                  title={`Post ${index + 1}`}
                />
              ))}

            {/* Viewport indicator */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-400/20 pointer-events-none rounded-sm shadow-lg"
              style={{
                left: Math.max(0, -viewportX * scaleX),
                top: Math.max(0, -viewportY * scaleY),
                width: Math.min(
                  minimapWidth - Math.max(0, -viewportX * scaleX),
                  (viewportWidth / scale) * scaleX
                ),
                height: Math.min(
                  minimapHeight - Math.max(0, -viewportY * scaleY),
                  (viewportHeight / scale) * scaleY
                ),
              }}
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {isExpanded
              ? "Click o arrastra para navegar"
              : "Click para navegar"}
          </p>
          {posts.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {posts.length} post{posts.length !== 1 ? "s" : ""} en el tablero
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
