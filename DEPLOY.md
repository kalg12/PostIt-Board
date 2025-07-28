# Deployment Guide - PostIt Board

## 🚀 Deploy en Vercel (Recomendado)

### 1. Preparar el repositorio

```bash
git add .
git commit -m "Initial commit - PostIt Board"
git push origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio
4. Configura las variables de entorno:

```env
DATABASE_URL=mysql://u223049366_postit:Postit@2025@193.203.166.219:3306/u223049366_postit
JWT_SECRET=tu_jwt_secret_super_seguro_para_produccion
NEXTAUTH_URL=https://tu-app.vercel.app
```

### 3. Deploy automático

Vercel detectará automáticamente que es una app Next.js y la desplegará.

## 🚂 Deploy en Railway

### 1. Conectar repositorio

1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Railway detectará automáticamente Next.js

### 2. Variables de entorno

Configura las mismas variables que en Vercel.

### 3. Deploy

Railway desplegará automáticamente tu aplicación.

## 📦 Deploy Manual (VPS/Servidor)

### 1. Clonar en servidor

```bash
git clone tu-repositorio
cd postit-board
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar entorno

```bash
cp .env.example .env
# Editar .env con datos de producción
```

### 4. Build y start

```bash
npm run build
npm start
```

### 5. PM2 (opcional para mantener activo)

```bash
npm install -g pm2
pm2 start npm --name "postit-board" -- start
pm2 startup
pm2 save
```

## 🔧 Configuraciones Adicionales

### Nginx (opcional)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL con Certbot

```bash
sudo certbot --nginx -d tu-dominio.com
```

## ✅ Verificación Post-Deploy

1. **Funcionalidad básica**: Acceder a la URL
2. **Registro**: Crear un usuario nuevo
3. **Login**: Iniciar sesión
4. **Canvas**: Crear y mover post-its
5. **Admin**: Acceder con admin@postit.com
6. **Base de datos**: Verificar que los posts se guarden

## 🐛 Troubleshooting Deploy

### Error de base de datos

- Verificar que la URL de conexión sea correcta
- Asegurar que el servidor MySQL permita conexiones remotas
- Verificar firewall y puertos

### Error de build

```bash
# Localmente
npm run build

# Si falla, verificar errores de TypeScript
npm run lint
```

### Variables de entorno

- Verificar que todas las variables estén configuradas
- JWT_SECRET debe ser diferente en producción
- NEXTAUTH_URL debe apuntar al dominio de producción

¡Tu aplicación PostIt Board estará lista para producción! 🎉
