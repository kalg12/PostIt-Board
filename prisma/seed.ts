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

  // Crear algunos posts de ejemplo con posiciones bien distribuidas (sin superposiciones)
  const postWidth = 200;
  const postHeight = 150;
  const margin = 30; // Margen entre posts

  const posts = await Promise.all([
    // Primera fila
    prisma.post.create({
      data: {
        content: "📚 Completar tarea de matemáticas para el viernes",
        x: 50,
        y: 50,
        color: "#FBBF24", // Amarillo
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "🎤 Preparar presentación de historia para la próxima semana",
        x: 50 + postWidth + margin, // 280
        y: 50,
        color: "#F87171", // Rojo claro
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "⚗️ Estudiar para examen de química - Capítulos 5 y 6",
        x: 50 + (postWidth + margin) * 2, // 510
        y: 50,
        color: "#60A5FA", // Azul
        authorId: users[2].id,
      },
    }),

    // Segunda fila - Posts con URLs
    prisma.post.create({
      data: {
        content:
          "📄 Revisar documentación importante:\nhttps://docs.google.com/document/d/abc123\nAntes del proyecto final",
        x: 50,
        y: 50 + postHeight + margin, // 230
        color: "#34D399", // Verde
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        content:
          "🎥 Tutorial muy útil:\nwww.youtube.com/watch?v=tutorial123\n\n💻 También revisar:\ngithub.com/usuario/proyecto-ejemplo",
        x: 50 + postWidth + margin, // 280
        y: 50 + postHeight + margin, // 230
        color: "#A78BFA", // Púrpura
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        content:
          "⏰ Recordatorio importante:\nEntrega en classroom.google.com\nFecha límite: Domingo 23:59",
        x: 50 + (postWidth + margin) * 2, // 510
        y: 50 + postHeight + margin, // 230
        color: "#FB7185", // Rosa
        authorId: users[2].id,
      },
    }),

    // Tercera fila
    prisma.post.create({
      data: {
        content: "📖 Leer capítulos 1-3 del libro de texto",
        x: 50,
        y: 50 + (postHeight + margin) * 2, // 410
        color: "#FCD34D", // Amarillo más claro
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "👥 Reunión de equipo - Viernes 3 PM\nSala de conferencias B",
        x: 50 + postWidth + margin, // 280
        y: 50 + (postHeight + margin) * 2, // 410
        color: "#86EFAC", // Verde claro
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "🏃‍♀️ Ejercicio personal:\nCorrer 30 min todos los días",
        x: 50 + (postWidth + margin) * 2, // 510
        y: 50 + (postHeight + margin) * 2, // 410
        color: "#F9A8D4", // Rosa claro
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
