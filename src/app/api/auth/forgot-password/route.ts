import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({
        message:
          "Si el email existe, recibirás un enlace para restablecer tu contraseña",
      });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    // const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Nota: En un proyecto real, deberías crear una tabla separada para tokens de reset
        // Por simplicidad, usaremos un campo temporal en el modelo User
        // Esto requeriría agregar campos resetToken y resetTokenExpiry al schema
      },
    });

    // En un proyecto real, aquí enviarías un email con el token
    // Por ahora, solo retornamos el token en la respuesta (solo para desarrollo)
    const resetUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    }/reset-password?token=${resetToken}`;

    console.log(`Reset URL for ${email}: ${resetUrl}`);

    return NextResponse.json({
      message:
        "Si el email existe, recibirás un enlace para restablecer tu contraseña",
      // Solo para desarrollo - remover en producción
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error en forgot password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
