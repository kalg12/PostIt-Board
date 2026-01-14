"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Calendar, User as UserIcon } from "lucide-react";
import { Toast, ToastProvider } from "@/components/Toast";

const MAX_CONTENT_LENGTH = 500;

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

export default function MyPostsPage() {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [toast, setToast] = useState<{
    open: boolean;
    title: string;
    description?: string;
    type: "success" | "error" | "info";
  }>({
    open: false,
    title: "",
    type: "info",
  });

  const fetchMyPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts/my-posts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        setToast({
          open: true,
          title: "Error al cargar posts",
          description: errorData.error || `Error del servidor (${response.status})`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al cargar posts:", error);
      setToast({
        open: true,
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchMyPosts();
  }, [isAuthenticated, router, fetchMyPosts]);

  const handleEdit = (post: Post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
  };

  const handleSaveEdit = async (postId: string) => {
    // Validar contenido antes de enviar
    const trimmedContent = editContent.trim();
    if (!trimmedContent) {
      setToast({
        open: true,
        title: "Error de validación",
        description: "El contenido no puede estar vacío",
        type: "error",
      });
      return;
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      setToast({
        open: true,
        title: "Error de validación",
        description: `El contenido no puede exceder ${MAX_CONTENT_LENGTH} caracteres`,
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: postId,
          content: trimmedContent,
        }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(
          posts.map((post) => (post.id === postId ? updatedPost : post))
        );
        setEditingPost(null);
        setEditContent("");
        setToast({
          open: true,
          title: "Post actualizado",
          description: "El post-it se actualizó exitosamente",
          type: "success",
        });
      } else {
        const errorData = await response.json();
        setToast({
          open: true,
          title: "Error al actualizar",
          description: errorData.error || "No se pudo actualizar el post",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al actualizar post:", error);
      setToast({
        open: true,
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        type: "error",
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (
      !confirm("¿Estás seguro de que quieres eliminar este post-it?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        setToast({
          open: true,
          title: "Post eliminado",
          description: "El post-it se eliminó exitosamente",
          type: "success",
        });
      } else {
        const errorData = await response.json();
        setToast({
          open: true,
          title: "Error al eliminar",
          description: errorData.error || "No se pudo eliminar el post",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al eliminar post:", error);
      setToast({
        open: true,
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        type: "error",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              {user?.role === "ADMIN" ? "Todos los Posts" : "Mis Posts"}
            </h1>
            <p className="text-lg text-gray-600">
              {user?.role === "ADMIN"
                ? "Administra todos los post-its del tablero"
                : "Administra tus post-its"}
            </p>
            <div className="mt-4 bg-white/80 rounded-lg px-4 py-2 inline-block">
              <p className="text-sm text-gray-700">
                Total: <span className="font-bold text-blue-600">{posts.length}</span> post{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No hay posts
              </h2>
              <p className="text-gray-600 mb-6">
                {user?.role === "ADMIN"
                  ? "No hay posts en el tablero"
                  : "Aún no has creado ningún post-it"}
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Ir al Tablero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  style={{ borderTop: `4px solid ${post.color}` }}
                >
                  <div className="p-6">
                    {editingPost === post.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={4}
                          maxLength={MAX_CONTENT_LENGTH}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(post.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-800 mb-4 whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>
                              {post.author.name} - Grupo {post.author.group}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleEdit(post)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Toast
          title={toast.title}
          description={toast.description}
          type={toast.type}
          open={toast.open}
          onOpenChange={(open) => setToast((prev) => ({ ...prev, open }))}
        />
      </div>
    </ToastProvider>
  );
}
