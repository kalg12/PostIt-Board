"use client";

interface Post {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  authorId: string;
  author: {
    name: string;
    group: string;
    career: string;
  };
  subject?: { id: string; name: string } | null;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import PostItComponent from "./PostItComponent";
import Minimap from "./Minimap";
import { usePostStore, useAuthStore } from "@/store/useStore";
import { Plus } from "lucide-react";
import PostItForm from "./PostItForm";
import {
  findFreePosition,
  redistributeOverlappingPosts,
  adjustPositionToAvoidCollision,
} from "@/lib/canvas-utils";
import { GROUPS } from "@/lib/constants";

export default function CanvasBoard() {
  // Filtros
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const { posts, setPosts, addPost, updatePost } = usePostStore();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPostPosition, setNewPostPosition] = useState({ x: 100, y: 100 });
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Estados para zoom y viewport
  const [scale, setScale] = useState(1);
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const canvasWidth = 4000;
  const canvasHeight = 3000;
  const minScale = 0.1;
  const maxScale = 3;

  // Estado para posiciones locales
  const [localPositions, setLocalPositions] = useState<{
    [id: string]: { x: number; y: number };
  }>({});

  // Obtener posts con filtros
  const fetchPosts = useCallback(async () => {
    try {
      let url = "/api/posts";
      const params = [];
      if (selectedGroup) params.push(`group=${selectedGroup}`);
      if (searchName.trim())
        params.push(`name=${encodeURIComponent(searchName.trim())}`);
      if (params.length) url += `?${params.join("&")}`;

      console.log("Fetching posts from:", url);
      const response = await fetch(url);
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = (await response.json()) as Post[];
        // Redistribuir post-its que se superponen automáticamente
        const redistributed = redistributeOverlappingPosts(
          data,
          200,
          150,
          canvasWidth,
          canvasHeight
        );
        setPosts(redistributed);
      } else {
        console.error("Response not ok:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error al cargar posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setPosts, selectedGroup, searchName, canvasWidth, canvasHeight]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Configurar tamaño del stage
  useEffect(() => {
    const updateSize = () => {
      // Calcular el espacio disponible restando navbar y footer
      const navbar = document.querySelector("nav");
      const footer = document.querySelector("footer");

      let navbarHeight = 0;
      let footerHeight = 0;

      if (navbar) {
        navbarHeight = navbar.getBoundingClientRect().height;
      }

      if (footer) {
        footerHeight = footer.getBoundingClientRect().height;
      }

      const availableHeight = window.innerHeight - navbarHeight - footerHeight;

      setStageSize({
        width: window.innerWidth,
        height: Math.max(availableHeight, 400), // Mínimo 400px de altura
      });
    };

    // Pequeño delay para asegurar que los elementos estén renderizados
    const timeoutId = setTimeout(updateSize, 100);
    window.addEventListener("resize", updateSize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Ajustar posición inicial del viewport cuando se carga el canvas
  useEffect(() => {
    if (stageSize.width > 0 && stageSize.height > 0) {
      // Centrar el viewport en el área visible
      const centerX = (canvasWidth - stageSize.width) / 2;
      const centerY = (canvasHeight - stageSize.height) / 2;

      setViewportPosition({
        x: Math.max(0, -centerX),
        y: Math.max(0, -centerY),
      });
    }
  }, [stageSize.width, stageSize.height]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Solo mostrar formulario si el usuario está autenticado y hace clic en área vacía
    if (!isAuthenticated || e.target !== e.target.getStage()) return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (pointer) {
      // Ajustar coordenadas por el zoom y viewport
      const realX = (pointer.x - viewportPosition.x) / scale;
      const realY = (pointer.y - viewportPosition.y) / scale;

      // Encontrar posición libre para evitar superposición
      const freePosition = findFreePosition(
        posts,
        200,
        150,
        canvasWidth,
        canvasHeight,
        realX,
        realY
      );

      setNewPostPosition(freePosition);
      setShowForm(true);
    }
  };

  // Funciones de zoom y viewport
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, maxScale);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, minScale);
    setScale(newScale);
  };

  const handleResetView = () => {
    setScale(1);
    // Centrar el viewport en el área visible
    const centerX = (canvasWidth - stageSize.width) / 2;
    const centerY = (canvasHeight - stageSize.height) / 2;

    const newPosition = {
      x: Math.max(0, -centerX),
      y: Math.max(0, -centerY),
    };

    setViewportPosition(newPosition);
    if (stageRef.current) {
      stageRef.current.position(newPosition);
      stageRef.current.scale({ x: 1, y: 1 });
    }
  };

  const handleViewportChange = (x: number, y: number) => {
    const newX = Math.max(
      Math.min(x, 0),
      stageSize.width - canvasWidth * scale
    );
    const newY = Math.max(
      Math.min(y, 0),
      stageSize.height - canvasHeight * scale
    );

    setViewportPosition({ x: newX, y: newY });
    if (stageRef.current) {
      stageRef.current.position({ x: newX, y: newY });
    }
  };

  // Manejar zoom con rueda del mouse
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale =
      e.evt.deltaY < 0
        ? Math.min(oldScale * scaleBy, maxScale)
        : Math.max(oldScale / scaleBy, minScale);

    setScale(newScale);

    // Mantener el zoom centrado en el cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    setViewportPosition(newPos);
  };

  const handlePostCreate = async (content: string, color: string) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content,
          x: newPostPosition.x,
          y: newPostPosition.y,
          color,
        }),
      });

      if (response.ok) {
        const newPost = await response.json();
        addPost(newPost);
        setShowForm(false);
      } else {
        console.error("Error al crear post");
      }
    } catch (error) {
      console.error("Error al crear post:", error);
    }
  };

  // Movimiento optimista: actualiza localmente y sincroniza con backend solo al soltar
  const handlePostMove = (postId: string, newPos: { x: number; y: number }) => {
    // Ajustar posición para evitar colisiones
    const allPosts = posts.map((post) => ({
      id: post.id,
      x: localPositions[post.id]?.x ?? post.x,
      y: localPositions[post.id]?.y ?? post.y,
    }));

    const adjustedPos = adjustPositionToAvoidCollision(
      newPos,
      postId,
      allPosts,
      200,
      150,
      canvasWidth,
      canvasHeight
    );

    setLocalPositions((prev) => {
      const updated = { ...prev, [postId]: adjustedPos };
      saveLocalPositions(updated);
      return updated;
    });
  };

  const handlePostUpdate = async (postId: string, updates: Partial<Post>) => {
    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: postId,
          ...updates,
        }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        updatePost(postId, updatedPost);
      }
    } catch (error) {
      console.error("Error al actualizar post:", error);
    }
  };

  const handlePostDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        usePostStore.getState().removePost(postId);
      }
    } catch (error) {
      console.error("Error al eliminar post:", error);
    }
  };

  // Al cargar posts, cargar posiciones locales si existen
  useEffect(() => {
    const saved = localStorage.getItem("postit-local-positions");
    if (saved) {
      setLocalPositions(JSON.parse(saved));
    }
  }, []);

  // Guardar posiciones locales en localStorage
  const saveLocalPositions = (positions: {
    [id: string]: { x: number; y: number };
  }) => {
    localStorage.setItem("postit-local-positions", JSON.stringify(positions));
  };

  // Optimización: solo renderizar los post-its visibles y evitar re-render innecesario
  // Memoizar el mapeo de posts visibles
  const visiblePosts = React.useMemo(() => {
    // Solo mapear los posts que vienen del filtro, y para cada uno, aplicar la posición local si existe
    return posts.map((post) => {
      const pos = localPositions[post.id];
      // Solo sobreescribir x/y si hay posición local
      return pos ? { ...post, x: pos.x, y: pos.y } : post;
    });
  }, [posts, localPositions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 overflow-hidden mural-bg">
      {/* Filtros */}
      <div className="absolute top-4 left-4 z-20 flex gap-3 bg-white/80 p-3 rounded-lg shadow-md">
        <button
          className={`px-3 py-1 rounded text-sm ${
            !selectedGroup && !searchName.trim()
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => {
            setSelectedGroup("");
            setSearchName("");
          }}
        >
          Ver todo
        </button>
        <select
          className="px-2 py-1 rounded border text-sm"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Filtrar por grupo</option>
          {GROUPS.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="px-3 py-1 rounded border text-sm min-w-[150px]"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>
      {/* Botón para agregar post */}
      {isAuthenticated && (
        <button
          onClick={() => {
            setNewPostPosition({ x: 100, y: 100 });
            setShowForm(true);
          }}
          className="fixed top-20 right-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white p-4 rounded-full shadow-xl z-10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Formulario para nuevo post */}
      {showForm && (
        <PostItForm
          onSubmit={handlePostCreate}
          onCancel={() => setShowForm(false)}
          position={newPostPosition}
        />
      )}

      {/* Canvas principal */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={viewportPosition.x}
        y={viewportPosition.y}
      >
        <Layer>
          {visiblePosts.map((post) => (
            <PostItComponent
              key={post.id}
              post={post}
              onMove={(x: number, y: number) =>
                handlePostMove(post.id, { x, y })
              }
              onUpdate={(updates: Partial<Post>) =>
                handlePostUpdate(post.id, updates)
              }
              onDelete={() => handlePostDelete(post.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Minimapa y controles de zoom */}
      <Minimap
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        viewportWidth={stageSize.width}
        viewportHeight={stageSize.height}
        viewportX={-viewportPosition.x / scale}
        viewportY={-viewportPosition.y / scale}
        scale={scale}
        posts={posts.map((post) => ({
          x: post.x,
          y: post.y,
          color: post.color,
        }))}
        onViewportChange={handleViewportChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
    </div>
  );
}
