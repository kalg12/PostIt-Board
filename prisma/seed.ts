import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  // Crear profesores
  const teachers = await prisma.teacher.createMany({
    data: [
      { firstName: "Ana", lastName: "Martínez", email: "ana.martinez@uni.com" },
      { firstName: "Luis", lastName: "Gómez", email: "luis.gomez@uni.com" },
      { firstName: "Sofía", lastName: "Ruiz", email: "sofia.ruiz@uni.com" },
    ],
    skipDuplicates: true,
  });

  // Obtener IDs de profesores
  const teacherAna = await prisma.teacher.findUnique({
    where: { email: "ana.martinez@uni.com" },
  });
  const teacherLuis = await prisma.teacher.findUnique({
    where: { email: "luis.gomez@uni.com" },
  });
  const teacherSofia = await prisma.teacher.findUnique({
    where: { email: "sofia.ruiz@uni.com" },
  });

  // Crear materias
  const subjects = await prisma.subject.createMany({
    data: [{ name: "Matemáticas" }, { name: "Historia" }, { name: "Química" }],
    skipDuplicates: true,
  });

  // Obtener IDs de materias
  const subjectMat = await prisma.subject.findFirst({
    where: { name: "Matemáticas" },
  });
  const subjectHis = await prisma.subject.findFirst({
    where: { name: "Historia" },
  });
  const subjectQui = await prisma.subject.findFirst({
    where: { name: "Química" },
  });

  // Relacionar profesores y materias (muchos a muchos)
  if (teacherAna && subjectMat) {
    await prisma.teacher.update({
      where: { id: teacherAna.id },
      data: { subjects: { connect: [{ id: subjectMat.id }] } },
    });
  }
  if (teacherLuis && subjectHis) {
    await prisma.teacher.update({
      where: { id: teacherLuis.id },
      data: { subjects: { connect: [{ id: subjectHis.id }] } },
    });
  }
  if (teacherSofia && subjectQui) {
    await prisma.teacher.update({
      where: { id: teacherSofia.id },
      data: { subjects: { connect: [{ id: subjectQui.id }] } },
    });
  }

  // Crear usuarios
  const adminPassword = await hashPassword("admin123");
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
    prisma.user.upsert({
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
    }),
  ]);

  // Crear posts con relaciones
  const postWidth = 200;
  const postHeight = 150;
  const margin = 30;
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: "📚 Completar tarea de matemáticas para el viernes",
        x: 50,
        y: 50,
        color: "#FBBF24",
        authorId: users[0].id,
        subjectId: subjectMat?.id,
        teacherId: teacherAna?.id,
      },
    }),
    prisma.post.create({
      data: {
        content: "🎤 Preparar presentación de historia para la próxima semana",
        x: 50 + postWidth + margin,
        y: 50,
        color: "#F87171",
        authorId: users[1].id,
        subjectId: subjectHis?.id,
        teacherId: teacherLuis?.id,
      },
    }),
    prisma.post.create({
      data: {
        content: "⚗️ Estudiar para examen de química - Capítulos 5 y 6",
        x: 50 + (postWidth + margin) * 2,
        y: 50,
        color: "#60A5FA",
        authorId: users[2].id,
        subjectId: subjectQui?.id,
        teacherId: teacherSofia?.id,
      },
    }),
  ]);

  console.log("Profesores creados:", teachers.count);
  console.log("Materias creadas:", subjects.count);
  console.log("Usuarios de ejemplo creados:", users.length);
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
