import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { z } from "zod";
import { getRandomColor } from "@/lib/utils";

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "El contenido es requerido")
    .max(500, "El contenido no puede exceder 500 caracteres"),
  x: z.number(),
  y: z.number(),
  color: z.string().optional(),
});

const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "El contenido es requerido")
    .max(500, "El contenido no puede exceder 500 caracteres")
    .optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  color: z.string().optional(),
});

const deletePostsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

// GET - Obtener todos los posts
export async function GET(request: NextRequest) {
  try {
    const subjectId = request.nextUrl?.searchParams.get("subjectId") || "";
    const teacherId = request.nextUrl?.searchParams.get("teacherId") || "";
    const group = request.nextUrl?.searchParams.get("group") || "";
    const name = request.nextUrl?.searchParams.get("name") || "";

    const where: {
      subjectId?: string;
      teacherId?: string;
      author?: {
        group?: string;
        name?: {
          contains: string;
        };
      };
    } = {};

    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;

    // Construir filtros de autor
    if (group || name) {
      where.author = {};
      if (group) where.author.group = group;
      if (name) {
        where.author.name = {
          contains: name,
        };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            name: true,
            group: true,
            career: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error al obtener posts:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// POST - Crear nuevo post
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const {
      content,
      x,
      y,
      color = getRandomColor(),
    } = createPostSchema.parse(body);

    const post = await prisma.post.create({
      data: {
        content,
        x,
        y,
        color,
        authorId: user.userId,
      },
      include: {
        author: {
          select: {
            name: true,
            group: true,
            career: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al crear post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar post
export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const { id, ...updateData } = body;
    const validatedData = updatePostSchema.parse(updateData);

    if (!id) {
      return NextResponse.json(
        { error: "ID del post es requerido" },
        { status: 400 },
      );
    }

    // Verificar que el post existe y pertenece al usuario (o es admin)
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 },
      );
    }

    if (existingPost.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para editar este post" },
        { status: 403 },
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: validatedData,
      include: {
        author: {
          select: {
            name: true,
            group: true,
            career: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al actualizar post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar post
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = request.headers
      .get("content-type")
      ?.includes("application/json")
      ? await request.json()
      : null;
    const ids = body ? deletePostsSchema.parse(body).ids : id ? [id] : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "ID del post es requerido" },
        { status: 400 },
      );
    }

    const existingPosts = await prisma.post.findMany({
      where: { id: { in: ids } },
      select: { id: true, authorId: true },
    });

    if (existingPosts.length !== ids.length) {
      return NextResponse.json(
        { error: "Uno o más posts no fueron encontrados" },
        { status: 404 },
      );
    }

    if (
      user.role !== "ADMIN" &&
      existingPosts.some((post) => post.authorId !== user.userId)
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar uno o más posts" },
        { status: 403 },
      );
    }

    const deletedPosts = await prisma.post.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      message: `${deletedPosts.count} post${deletedPosts.count !== 1 ? "s" : ""} eliminado${deletedPosts.count !== 1 ? "s" : ""} exitosamente`,
      count: deletedPosts.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "La selección de posts no es válida", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al eliminar post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
