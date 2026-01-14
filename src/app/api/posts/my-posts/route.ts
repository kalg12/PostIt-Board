import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

// GET - Obtener los posts del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Admin puede ver todos los posts, usuarios regulares solo los suyos
    const where: { authorId?: string } =
      user.role === "ADMIN" ? {} : { authorId: user.userId };

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
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.error("Error al obtener posts del usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
