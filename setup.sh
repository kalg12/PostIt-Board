#!/bin/bash

echo "🚀 PostIt Board - Setup Automático"
echo "==================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instála Node.js"
    exit 1
fi

echo "✅ Node.js y npm están instalados"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas"

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor edita el archivo .env con tus datos de base de datos"
    echo "⚠️  Presiona Enter cuando hayas configurado .env..."
    read
fi

# Sincronizar base de datos
echo "🗄️ Sincronizando esquema de base de datos..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Error al sincronizar base de datos. Verifica tu configuración en .env"
    exit 1
fi

echo "✅ Base de datos sincronizada"

# Generar cliente Prisma
echo "⚙️ Generando cliente Prisma..."
npx prisma generate

# Ejecutar seed
echo "🌱 Creando datos iniciales..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Error al crear datos iniciales"
    exit 1
fi

echo "✅ Datos iniciales creados"

echo ""
echo "🎉 ¡Setup completado exitosamente!"
echo ""
echo "📋 Credenciales por defecto:"
echo "   Admin: admin@postit.com / admin123"
echo "   Estudiante: juan@estudiante.com / 123456"
echo ""
echo "🚀 Para iniciar la aplicación:"
echo "   npm run dev"
echo ""
echo "📱 La aplicación estará disponible en:"
echo "   http://localhost:3000 (o puerto disponible)"
echo ""
echo "📚 Consulta README.md para más información"
