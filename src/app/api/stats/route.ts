import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";

// GET - Obtener estadísticas (solo admin)
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    // Estadísticas generales
    const totalUsers = await prisma.user.count();
    const totalPosts = await prisma.post.count();

    // Estadísticas por carrera
    const postsByCareer = await prisma.$queryRaw`
      SELECT u.career, COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.authorId
      GROUP BY u.career
    `;

    // Estadísticas por grupo
    const postsByGroup = await prisma.$queryRaw`
      SELECT u.group, COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.authorId
      GROUP BY u.group
    `;

    // Usuarios más activos - usando query raw para ordenar por conteo de posts
    const activeUsers = await prisma.$queryRaw`
      SELECT u.id, u.name, u.group, u.career, COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.authorId
      GROUP BY u.id, u.name, u.group, u.career
      ORDER BY COUNT(p.id) DESC
      LIMIT 10
    `;

    // Posts recientes
    const recentPosts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            group: true,
            career: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      totalUsers,
      totalPosts,
      postsByCareer,
      postsByGroup,
      activeUsers,
      recentPosts,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autorizado")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("administrador")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
