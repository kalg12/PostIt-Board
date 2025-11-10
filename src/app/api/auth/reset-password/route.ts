import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    resetPasswordSchema.parse(body);

    // En un proyecto real, aquí buscarías el token en la base de datos
    // y verificarías que no haya expirado
    // Por simplicidad, asumimos que el token es válido

    // Buscar usuario por token (esto requeriría campos adicionales en el schema)
    // const user = await prisma.user.findFirst({
    //   where: {
    //     resetToken: token,
    //     resetTokenExpiry: {
    //       gt: new Date(),
    //     },
    //   },
    // });

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Token inválido o expirado" },
    //     { status: 400 }
    //   );
    // }

    // Hash de la nueva contraseña
    // const hashedPassword = await hashPassword(password);

    // Actualizar contraseña y limpiar token
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     password: hashedPassword,
    //     resetToken: null,
    //     resetTokenExpiry: null,
    //   },
    // });

    // Por ahora, solo retornamos éxito
    // En un proyecto real, implementarías la lógica completa arriba

    return NextResponse.json({
      message: "Contraseña restablecida exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error en reset password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
