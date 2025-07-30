"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import PostItComponent from "./PostItComponent";
import Minimap from "./Minimap";
import { usePostStore, useAuthStore } from "@/store/useStore";
import { Plus } from "lucide-react";
import PostItForm from "./PostItForm";
import { findFreePosition } from "@/lib/canvas-utils";

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
  createdAt: string;
  updatedAt: string;
}

export default function CanvasBoard() {
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

  // Obtener posts al cargar
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error al cargar posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Configurar tamaño del stage
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 64, // Restar altura del navbar
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
    setViewportPosition({ x: 0, y: 0 });
    if (stageRef.current) {
      stageRef.current.position({ x: 0, y: 0 });
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

  const handlePostMove = async (
    postId: string,
    newPos: { x: number; y: number }
  ) => {
    try {
      // Actualizar localmente primero para mejor UX
      updatePost(postId, newPos);

      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: postId,
          x: newPos.x,
          y: newPos.y,
        }),
      });

      if (!response.ok) {
        // Si falla, recargar posts para revertir el cambio
        await fetchPosts();
        console.error("Error al mover post");
      }
    } catch (error) {
      // Si falla, recargar posts para revertir el cambio
      await fetchPosts();
      console.error("Error al mover post:", error);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Botón para agregar post */}
      {isAuthenticated && (
        <button
          onClick={() => {
            setNewPostPosition({ x: 100, y: 100 });
            setShowForm(true);
          }}
          className="fixed top-20 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-10"
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
        draggable
        onClick={handleStageClick}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={viewportPosition.x}
        y={viewportPosition.y}
      >
        <Layer>
          {posts.map((post) => (
            <PostItComponent
              key={post.id}
              post={post}
              allPosts={posts}
              onMove={(newPos: { x: number; y: number }) =>
                handlePostMove(post.id, newPos)
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
