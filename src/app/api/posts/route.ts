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

// GET - Obtener todos los posts
export async function GET(request: NextRequest) {
  try {
    const subjectId = request.nextUrl?.searchParams.get("subjectId") || "";
    const teacherId = request.nextUrl?.searchParams.get("teacherId") || "";

    const where: {
      subjectId?: string;
      teacherId?: string;
    } = {};
    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;

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
      { status: 500 }
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
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al crear post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    // Verificar que el post existe y pertenece al usuario (o es admin)
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    if (existingPost.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para editar este post" },
        { status: 403 }
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
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al actualizar post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar post
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID del post es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el post existe y pertenece al usuario (o es admin)
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    if (existingPost.authorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este post" },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post eliminado exitosamente" });
  } catch (error) {
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al eliminar post:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
