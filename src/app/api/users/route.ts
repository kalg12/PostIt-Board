import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
  username: z
    .string()
    .min(2, "El username debe tener al menos 2 caracteres")
    .optional(),
  email: z.string().email("Email inválido").optional(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional(),
  group: z.string().min(1, "El grupo es requerido").optional(),
  career: z
    .enum([
      "SISTEMAS",
      "CONTADURIA",
      "DERECHO",
      "ADMINISTRACION",
      "PSICOLOGIA",
      "MEDICINA",
    ])
    .optional(),
  numero_de_control: z.string().optional(),
  role: z.enum(["ADMIN", "STUDENT"]).optional(),
});

// GET - Obtener todos los usuarios (solo admin)
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        group: true,
        career: true,
        numero_de_control: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error && error.message.includes("autorizado")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("administrador")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario (solo admin)
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID del usuario es requerido" },
        { status: 400 }
      );
    }

    const validatedData = updateUserSchema.parse(updateData);

    // Si se está actualizando la contraseña, hashearla
    if (validatedData.password) {
      validatedData.password = await hashPassword(validatedData.password);
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si se está actualizando el email, verificar que no exista
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 409 }
        );
      }
    }

    // Si se está actualizando el username, verificar que no exista
    if (
      validatedData.username &&
      validatedData.username !== existingUser.username
    ) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: validatedData.username },
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: "El username ya está en uso" },
          { status: 409 }
        );
      }
    }

    // Si se está actualizando el numero_de_control, verificar que no exista
    if (
      validatedData.numero_de_control &&
      validatedData.numero_de_control !== existingUser.numero_de_control
    ) {
      const controlExists = await prisma.user.findUnique({
        where: { numero_de_control: validatedData.numero_de_control },
      });

      if (controlExists) {
        return NextResponse.json(
          { error: "El número de control ya está en uso" },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        group: true,
        career: true,
        numero_de_control: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("autorizado")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("administrador")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID del usuario es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autorizado")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("administrador")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
