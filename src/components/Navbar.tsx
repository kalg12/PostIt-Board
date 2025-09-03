"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useStore";
import { LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Limpiar cookies si las hay
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl border-b border-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-white font-bold text-xl">TD</span>
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white">
                    Tablero Digital
                  </h1>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-800 text-sm">
                      {user.name}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Grupo</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {user.group}
                      </span>
                    </div>
                  </div>
                </div>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-all duration-200 shadow-lg hover:shadow-xl border border-red-400/50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-blue-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
