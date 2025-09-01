import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

// Schema para validar cada fila del CSV
const csvUserSchema = z.object({
  grupo: z.string().min(1, "El grupo es requerido"),
  username: z.string().min(1, "El username es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  firstname: z.string().min(1, "El nombre es requerido"),
  numero_de_control: z.string().min(1, "El número de control es requerido"),
});

// POST - Subir usuarios desde CSV (solo admin)
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Verificar que sea un archivo CSV
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "El archivo debe ser un CSV" },
        { status: 400 }
      );
    }

    // Leer el contenido del archivo
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "El archivo CSV debe tener al menos una fila de datos" },
        { status: 400 }
      );
    }

    // Obtener headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Verificar que los headers sean correctos
    const requiredHeaders = [
      "grupo",
      "username",
      "password",
      "firstname",
      "numero_de_control",
    ];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan los siguientes headers: ${missingHeaders.join(", ")}`,
          expectedHeaders: requiredHeaders,
          receivedHeaders: headers,
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: [] as string[],
      created: [] as string[],
    };

    // Procesar cada línea
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(",").map((v) => v.trim());

        if (values.length !== headers.length) {
          results.errors.push(`Línea ${i + 1}: Número de columnas incorrecto`);
          continue;
        }

        // Crear objeto con los datos
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Validar datos
        const validatedData = csvUserSchema.parse(rowData);

        // Verificar si el usuario ya existe (por username, email o numero_de_control)
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: validatedData.username },
              { numero_de_control: validatedData.numero_de_control },
            ],
          },
        });

        if (existingUser) {
          results.errors.push(
            `Línea ${i + 1}: Usuario ya existe (${validatedData.username})`
          );
          continue;
        }

        // Generar email basado en el username
        const email = `${validatedData.username}@estudiante.com`;

        // Verificar si el email ya existe
        const existingEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingEmail) {
          results.errors.push(`Línea ${i + 1}: Email ya existe (${email})`);
          continue;
        }

        // Hash de la contraseña
        const hashedPassword = await hashPassword(validatedData.password);

        // Crear usuario
        await prisma.user.create({
          data: {
            name: validatedData.firstname,
            username: validatedData.username,
            email,
            password: hashedPassword,
            group: validatedData.grupo,
            career: "SISTEMAS", // Por defecto, se puede cambiar después
            numero_de_control: validatedData.numero_de_control,
            role: "STUDENT",
          },
        });

        results.success++;
        results.created.push(validatedData.username);
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push(
            `Línea ${i + 1}: ${error.errors.map((e) => e.message).join(", ")}`
          );
        } else {
          results.errors.push(
            `Línea ${i + 1}: Error inesperado - ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          );
        }
      }
    }

    return NextResponse.json({
      message: `Procesamiento completado. ${results.success} usuarios creados exitosamente.`,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("autorizado")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("administrador")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Error al procesar CSV:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
