"use client";

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-semibold">
              Centro de Estudios Tecnológicos del Mar No. 18
            </p>
            <p className="text-sm text-gray-600">Acapulco, Gro.</p>
            <p className="text-sm text-blue-700 font-medium bg-blue-100 px-3 py-1 rounded-full inline-block">
              Productos Académicos
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © {currentYear} Tablero Digital. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
