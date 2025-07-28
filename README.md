# PostIt Board - Muro Colaborativo

Un muro colaborativo tipo Trello donde los estudiantes pueden publicar sus tareas en forma de post-its dentro de un canvas con zoom infinito.

## 🚀 Características

### Frontend

- **Canvas interactivo** con zoom infinito usando Konva.js
- **Post-its arrastrables** con colores personalizables
- **Información del estudiante** (nombre, grupo, carrera) en cada post-it
- **Posicionamiento libre** con coordenadas x,y guardadas
- **Responsive design** con TailwindCSS

### Autenticación

- **Sistema de login/logout** con JWT personalizado
- **Registro de usuarios** con validación
- **Roles de usuario**: ADMIN y STUDENT
- **Protección de rutas** del API

### Backend (API Routes)

- **CRUD completo** de usuarios y post-its
- **Autenticación JWT** personalizada
- **Middleware de autorización** para rutas protegidas
- **Validación de datos** con Zod

### Panel Administrativo

- **Gestión de usuarios** (ver, editar, eliminar)
- **Estadísticas de participación** por grupo y carrera
- **Cambio de roles** y contraseñas
- **Métricas del sistema**

### Base de Datos

- **Prisma ORM** con MySQL
- **Modelos estructurados**: User y Post
- **Enums**: Role (ADMIN, STUDENT) y Career
- **Relaciones**: Un usuario puede tener múltiples posts

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **Canvas**: Konva.js + React-Konva
- **Base de datos**: MySQL + Prisma ORM
- **Autenticación**: JWT + bcryptjs
- **Estado global**: Zustand
- **Validación**: Zod
- **Formularios**: React Hook Form
- **Icons**: Lucide React

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- Base de datos MySQL

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd postit-board
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y configura las variables:

```env
# Base de datos MySQL
DATABASE_URL="mysql://usuario:password@host:puerto/base_de_datos"

# JWT Secret para autenticación
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"

# URL base de la aplicación
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configurar la base de datos

```bash
# Sincronizar el esquema con la base de datos
npx prisma db push

# Generar el cliente de Prisma
npx prisma generate

# Crear datos iniciales (usuarios y posts de ejemplo)
npm run seed
```

### 5. Ejecutar el proyecto

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Usuarios por Defecto

Después de ejecutar `npm run seed`, tendrás estos usuarios disponibles:

### Administrador

- **Email**: `admin@postit.com`
- **Contraseña**: `admin123`
- **Rol**: ADMIN

### Estudiantes de Ejemplo

- **Email**: `juan@estudiante.com` | **Contraseña**: `123456`
- **Email**: `maria@estudiante.com` | **Contraseña**: `123456`
- **Email**: `carlos@estudiante.com` | **Contraseña**: `123456`

## 🎯 Uso

### Para Estudiantes

1. **Registrarse** con nombre, email, grupo y carrera
2. **Iniciar sesión** con las credenciales
3. **Crear post-its** haciendo clic en el canvas o usando el botón (+)
4. **Editar contenido** haciendo doble clic en un post-it propio
5. **Mover post-its** arrastrándolos por el canvas
6. **Eliminar post-its** con clic derecho (solo los propios)

### Para Administradores

1. **Acceder al panel admin** desde el menú superior
2. **Gestionar usuarios**: ver, editar roles, eliminar
3. **Ver estadísticas**: posts por carrera, usuarios activos
4. **Moderar contenido**: editar/eliminar cualquier post-it

## 🗂️ Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   ├── auth/          # Endpoints de autenticación
│   │   ├── posts/         # CRUD de post-its
│   │   ├── users/         # Gestión de usuarios
│   │   └── stats/         # Estadísticas
│   ├── admin/             # Panel administrativo
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal (canvas)
├── components/            # Componentes React
│   ├── CanvasBoard.tsx    # Canvas principal con Konva
│   ├── PostItComponent.tsx # Componente de post-it
│   ├── PostItForm.tsx     # Formulario para crear post-its
│   └── Navbar.tsx         # Barra de navegación
├── lib/                   # Utilidades y configuración
│   ├── prisma.ts          # Cliente de Prisma
│   ├── auth.ts            # Funciones de autenticación
│   ├── auth-middleware.ts # Middleware de autorización
│   └── utils.ts           # Utilidades generales
└── store/                 # Estado global con Zustand
    └── useStore.ts        # Stores de auth y posts
```

## 🎨 Características del Canvas

- **Zoom infinito**: Usa la rueda del mouse para hacer zoom
- **Arrastrar vista**: Mantén presionado y arrastra para mover la vista
- **Crear post-its**: Haz clic en un área vacía (requiere login)
- **Colores**: 10 colores predefinidos para los post-its
- **Persistencia**: Las posiciones se guardan automáticamente

## 🔐 Seguridad

- **Passwords hasheadas** con bcryptjs (12 rounds)
- **JWT tokens** con expiración de 7 días
- **Validación de entrada** con Zod en todas las rutas
- **Autorización basada en roles** (ADMIN/STUDENT)
- **Protección CSRF** automática con Next.js

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno en el panel de Vercel
3. Despliega automáticamente

### Railway

1. Conecta tu repositorio con Railway
2. Configura las variables de entorno
3. Railway detectará automáticamente que es una app Next.js

### Variables de Entorno para Producción

```env
DATABASE_URL="mysql://usuario:password@host:puerto/base_de_datos"
JWT_SECRET="un_secret_muy_seguro_para_produccion"
NEXTAUTH_URL="https://tu-dominio.com"
```

## 📊 Base de Datos

### Modelo User

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  group     String
  career    Career
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}
```

### Modelo Post

```prisma
model Post {
  id        String   @id @default(cuid())
  content   String   @db.Text
  x         Float
  y         Float
  color     String   @default("#FBBF24")
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id])
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build para producción
npm run start      # Servidor de producción
npm run lint       # Linter de código
npm run seed       # Crear datos iniciales
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

- Verifica que la URL de conexión en `.env` sea correcta
- Asegúrate de que el servidor MySQL esté ejecutándose
- Verifica los permisos del usuario de la base de datos

### Problemas con Prisma

```bash
# Resetear la base de datos
npx prisma db push --force-reset

# Regenerar el cliente
npx prisma generate
```

### Problemas de autenticación

- Verifica que `JWT_SECRET` esté configurado en `.env`
- Limpia el localStorage del navegador
- Verifica que las cookies no estén bloqueadas

## 📧 Soporte

Si tienes algún problema o pregunta, puedes:

- Abrir un issue en GitHub
- Contactar al administrador del sistema

---

**PostIt Board** - Desarrollado con ❤️ para facilitar la colaboración estudiantil
