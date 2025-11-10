# Instrucciones de Configuración Rápida

## 🚀 Inicio Rápido (5 minutos)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

El archivo `.env` ya está configurado con tu base de datos MySQL.

### 3. Sincronizar esquema y crear datos

```bash
npx prisma db push
npm run seed
```

### 4. Ejecutar aplicación

```bash
npm run dev
```

## 👤 Credenciales de Acceso

### Administrador

- **URL**: http://localhost:3001/login
- **Email**: admin@postit.com
- **Password**: admin123

### Estudiantes de Prueba

- **Email**: juan@estudiante.com | **Password**: 123456
- **Email**: maria@estudiante.com | **Password**: 123456
- **Email**: carlos@estudiante.com | **Password**: 123456

## 🎯 Funcionalidades para Probar

### Como Estudiante:

1. Registrarse en: http://localhost:3001/register
2. Crear post-its haciendo clic en el canvas
3. Arrastrar post-its por el canvas
4. Editar contenido (doble clic)
5. Cambiar colores

### Como Administrador:

1. Acceder al panel admin: http://localhost:3001/admin
2. Ver estadísticas de usuarios y posts
3. Gestionar usuarios (cambiar roles, eliminar)
4. Ver métricas por carrera y grupo

## 🐛 Solución de Problemas Comunes

### Puerto ocupado

Si el puerto 3000 está ocupado, Next.js usará automáticamente el 3001.

### Error de base de datos

```bash
# Verificar conexión
npx prisma db pull

# Recrear esquema
npx prisma db push --force-reset
npm run seed
```

### Limpiar caché

```bash
rm -rf .next
npm run dev
```

## 📱 URLs Importantes

- **Inicio**: http://localhost:3001
- **Login**: http://localhost:3001/login
- **Registro**: http://localhost:3001/register
- **Admin**: http://localhost:3001/admin (solo administradores)

## 🎨 Características del Canvas

- **Crear post-it**: Clic en área vacía (requiere login)
- **Mover post-it**: Arrastrar
- **Editar**: Doble clic en tu post-it
- **Eliminar**: Clic derecho en tu post-it
- **Zoom**: Rueda del mouse
- **Navegación**: Arrastrar el canvas

¡Tu aplicación PostIt Board está lista para usar! 🎉
