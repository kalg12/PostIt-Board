import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("🧹 Limpiando base de datos...");

    // Eliminar en orden para respetar las foreign keys
    await prisma.post.deleteMany({});
    console.log("✅ Posts eliminados");

    await prisma.user.deleteMany({});
    console.log("✅ Usuarios eliminados");

    // Eliminar relaciones many-to-many
    await prisma.$executeRaw`DELETE FROM _TeacherSubjects`;
    console.log("✅ Relaciones Teacher-Subject eliminadas");

    await prisma.subject.deleteMany({});
    console.log("✅ Materias eliminadas");

    await prisma.teacher.deleteMany({});
    console.log("✅ Profesores eliminados");

    console.log("🎉 Base de datos limpiada exitosamente");
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
