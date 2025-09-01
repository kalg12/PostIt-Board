import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  username: z.string().min(2, "El username debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  group: z.string().min(1, "El grupo es requerido"),
  numero_de_control: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, username, email, password, group, numero_de_control } =
      registerSchema.parse(body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          ...(numero_de_control ? [{ numero_de_control }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "El usuario ya existe con este email" },
          { status: 409 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "El username ya está en uso" },
          { status: 409 }
        );
      }
      if (
        numero_de_control &&
        existingUser.numero_de_control === numero_de_control
      ) {
        return NextResponse.json(
          { error: "El número de control ya está en uso" },
          { status: 409 }
        );
      }
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        group,
        ...(numero_de_control && { numero_de_control }),
      },
    });

    // Devolver usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "Usuario creado exitosamente", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
