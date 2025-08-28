"use client";

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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
import { findFreePosition } from "@/lib/canvas-utils";

// Interfaces solo una vez, al inicio
interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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

export default function CanvasBoard() {
  // Filtros
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
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
      if (selectedSubject) params.push(`subjectId=${selectedSubject}`);
      if (selectedTeacher) params.push(`teacherId=${selectedTeacher}`);
      if (params.length) url += `?${params.join("&")}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error al cargar posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setPosts, selectedSubject, selectedTeacher]);
  // Obtener materias y profesores para los filtros
  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await fetch("/api/subjects");
      if (res.ok) setSubjects(await res.json());
    };
    const fetchTeachers = async () => {
      const res = await fetch("/api/teachers");
      if (res.ok) setTeachers(await res.json());
    };
    fetchSubjects();
    fetchTeachers();
  }, []);

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

  // Movimiento optimista: actualiza localmente y sincroniza con backend solo al soltar
  const handlePostMove = (postId: string, newPos: { x: number; y: number }) => {
    setLocalPositions((prev) => {
      const updated = { ...prev, [postId]: newPos };
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Filtros */}
      <div className="absolute top-4 left-4 z-20 flex gap-4 bg-white/80 p-3 rounded-lg shadow-md">
        <button
          className={`px-3 py-1 rounded ${
            !selectedSubject && !selectedTeacher
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => {
            setSelectedSubject("");
            setSelectedTeacher("");
          }}
        >
          Ver todo
        </button>
        <select
          className="px-2 py-1 rounded border"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Filtrar por materia</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="px-2 py-1 rounded border"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">Filtrar por profesor</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </select>
      </div>
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
