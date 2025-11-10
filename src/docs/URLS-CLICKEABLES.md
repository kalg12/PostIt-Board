# URLs Clickeables en Post-its

## Funcionalidad Implementada

La aplicación PostIt Board ahora incluye soporte para URLs clickeables dentro del contenido de los post-its.

### Características

- **Detección automática de URLs**: El sistema detecta automáticamente URLs en el texto de los post-its
- **Renderizado visual**: Las URLs se muestran en color azul y subrayadas para indicar que son clickeables
- **Múltiples formatos soportados**:
  - URLs completas: `https://example.com`
  - URLs con www: `www.example.com`
  - Dominios simples: `example.com`

### Formatos de URL Soportados

```
✅ https://docs.google.com/document/d/1234567890
✅ http://example.com/path/to/page
✅ www.youtube.com/watch?v=dQw4w9WgXcQ
✅ github.com/usuario/proyecto
✅ classroom.google.com
✅ stackoverflow.com/questions/12345
```

### Cómo Funciona

1. **Creación**: Cuando un usuario crea o edita un post-it, puede incluir URLs directamente en el texto
2. **Detección**: El sistema automáticamente detecta las URLs usando expresiones regulares
3. **Renderizado**: Las URLs se renderizan como texto azul y subrayado
4. **Interacción**: Al hacer clic en una URL, se abre en una nueva pestaña del navegador

### Ejemplos de Uso

#### Post-it con URL simple:

```
Revisar documentación en https://docs.google.com/document/d/1234567890
```

#### Post-it con múltiples URLs:

```
Tutorial útil: www.youtube.com/watch?v=dQw4w9WgXcQ
También revisar github.com/usuario/proyecto
```

#### Post-it con texto mixto:

```
Recordatorio: Entrega en classroom.google.com el domingo
No olvidar revisar los requisitos
```

### Implementación Técnica

#### Archivo: `src/lib/url-utils.ts`

- Función `detectURLs()`: Detecta y separa URLs del texto normal
- Función `openURL()`: Abre URLs en nuevas pestañas con seguridad

#### Archivo: `src/components/PostItComponent.tsx`

- Renderizado inteligente de texto con URLs
- Manejo de eventos de clic para URLs
- Layout responsivo que respeta los límites del post-it

### Seguridad

- Las URLs se abren en nuevas pestañas con `noopener` y `noreferrer`
- Prevención de ataques XSS mediante validación de URLs
- No se ejecuta JavaScript automáticamente

### Limitaciones Actuales

- Las URLs muy largas pueden ser truncadas si exceden el espacio del post-it
- Solo se soportan URLs HTTP/HTTPS
- No se valida si la URL está activa o es válida

### Datos de Prueba

Se incluyen posts de ejemplo en `prisma/seed.ts` con diferentes tipos de URLs para demostrar la funcionalidad:

1. Post con URL de Google Docs
2. Post con múltiples URLs (YouTube y GitHub)
3. Post con URL de Google Classroom

Para cargar los datos de prueba:

```bash
npx tsx prisma/seed.ts
```

### Uso en la Aplicación

1. Inicia sesión en la aplicación
2. Crea un nuevo post-it o edita uno existente
3. Incluye cualquier URL en el contenido
4. Las URLs aparecerán automáticamente en azul y subrayadas
5. Haz clic en cualquier URL para abrirla en una nueva pestaña
