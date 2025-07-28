import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  // Crear usuario administrador
  const adminPassword = await hashPassword("admin123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@postit.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@postit.com",
      password: adminPassword,
      group: "ADMIN",
      career: "SISTEMAS",
      role: "ADMIN",
    },
  });

  console.log("Usuario administrador creado:", admin);

  // Crear algunos usuarios de ejemplo
  const userPassword = await hashPassword("123456");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "juan@estudiante.com" },
      update: {},
      create: {
        name: "Juan Pérez",
        email: "juan@estudiante.com",
        password: userPassword,
        group: "A1",
        career: "SISTEMAS",
      },
    }),
    prisma.user.upsert({
      where: { email: "maria@estudiante.com" },
      update: {},
      create: {
        name: "María García",
        email: "maria@estudiante.com",
        password: userPassword,
        group: "B2",
        career: "CONTADURIA",
      },
    }),
    prisma.user.upsert({
      where: { email: "carlos@estudiante.com" },
      update: {},
      create: {
        name: "Carlos López",
        email: "carlos@estudiante.com",
        password: userPassword,
        group: "C1",
        career: "DERECHO",
      },
    }),
  ]);

  console.log("Usuarios de ejemplo creados:", users.length);

  // Crear algunos posts de ejemplo
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: "Completar tarea de matemáticas para el viernes",
        x: 100,
        y: 100,
        color: "#FBBF24",
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "Preparar presentación de historia",
        x: 350,
        y: 150,
        color: "#F87171",
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "Estudiar para examen de química",
        x: 200,
        y: 300,
        color: "#60A5FA",
        authorId: users[2].id,
      },
    }),
    // Posts con URLs
    prisma.post.create({
      data: {
        content:
          "Revisar documentación en https://docs.google.com/document/d/1234567890 antes del proyecto final",
        x: 450,
        y: 200,
        color: "#34D399",
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        content:
          "Tutorial útil: www.youtube.com/watch?v=dQw4w9WgXcQ\nTambién revisar github.com/usuario/proyecto",
        x: 150,
        y: 450,
        color: "#A78BFA",
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "Recordatorio: Entrega en classroom.google.com el domingo",
        x: 500,
        y: 350,
        color: "#FB7185",
        authorId: users[2].id,
      },
    }),
  ]);

  console.log("Posts de ejemplo creados:", posts.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
