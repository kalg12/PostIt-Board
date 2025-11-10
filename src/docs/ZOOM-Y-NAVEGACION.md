# Sistema de Zoom y Navegación Avanzada

## Nuevas Funcionalidades Implementadas

### 1. 🔍 **Sistema de Zoom Completo**

- **Zoom con rueda del mouse**: Usa la rueda del ratón para acercar/alejar
- **Controles de zoom**: Botones `+` y `-` en el minimapa
- **Zoom centrado en cursor**: El zoom se centra donde está el cursor
- **Límites de zoom**: Mínimo 10% y máximo 300%

### 2. 🗺️ **Minimapa Interactivo**

- **Vista general**: Muestra todo el canvas en un pequeño recuadro
- **Navegación rápida**: Haz clic en cualquier parte del minimapa para saltar ahí
- **Indicador de viewport**: Rectángulo azul que muestra tu vista actual
- **Posts visibles**: Cada post-it aparece como un punto de color en el minimapa

### 3. 🚫 **Prevención de Superposición**

- **Detección automática**: Evita que los post-its se superpongan
- **Posicionamiento inteligente**: Encuentra automáticamente posiciones libres
- **Ajuste al mover**: Cuando mueves un post-it, se ajusta para evitar colisiones

### 4. 📝 **Mejoras en URLs**

- **Truncado inteligente**: URLs largas se cortan elegantemente con "..."
- **Máximo 2 líneas**: URLs muy largas solo muestran las primeras 2 líneas
- **Mejor wrapping**: El texto se ajusta mejor dentro de las tarjetas

## Cómo Usar las Nuevas Funcionalidades

### 🖱️ **Navegación**

1. **Zoom con Mouse**:

   - Rueda hacia arriba = Acercar
   - Rueda hacia abajo = Alejar
   - El zoom se centra donde está tu cursor

2. **Controles del Minimapa**:

   - `+` = Acercar
   - `-` = Alejar
   - `↻` = Resetear vista (zoom 100%, posición inicial)

3. **Navegación con Minimapa**:
   - Haz clic en cualquier punto del minimapa
   - La vista principal saltará a esa ubicación
   - El rectángulo azul muestra tu vista actual

### 📌 **Creación de Post-its**

1. **Posicionamiento Automático**:

   - Al crear un nuevo post-it, el sistema encuentra automáticamente una posición libre
   - No se superponen con post-its existentes
   - Utiliza un algoritmo en espiral para buscar el mejor lugar

2. **Movimiento Inteligente**:
   - Arrastra post-its normalmente
   - Si intentas colocar uno encima de otro, se ajusta automáticamente
   - Mantiene un margen de separación entre post-its

### 🔗 **URLs Mejoradas**

1. **Texto Adaptativo**:
   - URLs largas se truncan automáticamente
   - Mantienen la funcionalidad de clic
   - Mejor distribución del texto en tarjetas pequeñas

## Características Técnicas

### Canvas Expandido

- **Tamaño**: 4000x3000 píxeles (vs. tamaño de ventana anterior)
- **Navegación**: Arrastrar y zoom para explorar todo el espacio
- **Rendimiento**: Optimizado para manejar muchos post-its

### Algoritmos Implementados

1. **Detección de Colisiones**:

   ```typescript
   function isOverlapping(rect1, rect2): boolean;
   ```

2. **Búsqueda de Posición Libre**:

   ```typescript
   function findFreePosition(existingPosts, startX, startY): Position;
   ```

3. **Ajuste Anti-Colisión**:
   ```typescript
   function adjustPositionToAvoidCollision(
     newPos,
     movingPostId,
     existingPosts
   ): Position;
   ```

### Componentes Nuevos

- **`Minimap.tsx`**: Componente del minimapa con controles
- **`canvas-utils.ts`**: Utilidades para manejo de posiciones y colisiones
- **`url-utils.ts`**: Utilidades mejoradas para manejo de URLs

## Controles y Atajos

| Acción           | Control                               |
| ---------------- | ------------------------------------- |
| Zoom In          | Rueda ↑ o botón `+`                   |
| Zoom Out         | Rueda ↓ o botón `-`                   |
| Navegar          | Clic en minimapa                      |
| Resetear Vista   | Botón `↻`                             |
| Arrastrar Canvas | Mantener y arrastrar en espacio vacío |
| Crear Post-it    | Clic en espacio vacío (logueado)      |
| Mover Post-it    | Arrastrar post-it                     |

## Mejoras de UX

1. **Feedback Visual**:

   - Cursor pointer sobre URLs
   - Indicadores de zoom en tiempo real
   - Vista previa del viewport en minimapa

2. **Prevención de Errores**:

   - No se pueden superponer post-its
   - Límites de zoom para evitar perderse
   - Posicionamiento automático inteligente

3. **Navegación Intuitiva**:
   - Minimapa siempre visible
   - Zoom centrado en cursor
   - Controles accesibles

## Datos de Prueba

Los posts de semilla incluyen ejemplos con URLs para probar las nuevas funcionalidades:

```bash
npx tsx prisma/seed.ts
```

Esto creará posts con:

- URLs de Google Docs
- Links de YouTube
- URLs de GitHub
- Enlaces de Classroom

## Performance

- **Renderizado optimizado**: Solo los post-its visibles se procesan completamente
- **Zoom eficiente**: Utiliza transformaciones CSS/Canvas nativas
- **Minimapa liviano**: Representa posts como puntos simples
- **Detección de colisiones**: Algoritmo O(n) optimizado para pocos elementos
