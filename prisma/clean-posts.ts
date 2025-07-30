import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanPosts() {
  try {
    // Eliminar todos los posts
    const deletedPosts = await prisma.post.deleteMany({});
    console.log(`✅ Se eliminaron ${deletedPosts.count} posts`);
    
    console.log("🗑️ Base de datos limpia - solo posts eliminados");
  } catch (error) {
    console.error("❌ Error al limpiar posts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPosts();
