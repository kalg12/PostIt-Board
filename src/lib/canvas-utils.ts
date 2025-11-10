// Utilidades para el manejo de posiciones y colisiones en el canvas

export interface Position {
  x: number;
  y: number;
}

export interface PostBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Verificar si dos rectángulos se superponen
export function isOverlapping(rect1: PostBounds, rect2: PostBounds): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  );
}

// Encontrar una posición libre para un nuevo post-it
export function findFreePosition(
  existingPosts: Array<{ x: number; y: number }>,
  postWidth: number = 200,
  postHeight: number = 150,
  canvasWidth: number = 2000,
  canvasHeight: number = 2000,
  startX: number = 100,
  startY: number = 100
): Position {
  const margin = 30; // Espacio mínimo entre post-its (aumentado para mejor separación)
  const gridSize = 50; // Tamaño de la grilla para posicionamiento

  // Convertir posts existentes a bounds
  const existingBounds = existingPosts.map((post) => ({
    x: post.x,
    y: post.y,
    width: postWidth + margin,
    height: postHeight + margin,
  }));

  // Si no hay posts existentes, distribuir mejor en el canvas
  if (existingBounds.length === 0) {
    // Usar una posición más centrada pero no siempre la misma
    const centerX = canvasWidth / 2 - postWidth / 2;
    const centerY = canvasHeight / 2 - postHeight / 2;
    return { x: centerX, y: centerY };
  }

  // Buscar en múltiples puntos de inicio para distribuir mejor
  const searchPoints = [
    { x: startX, y: startY },
    { x: canvasWidth / 4, y: canvasHeight / 4 },
    { x: (canvasWidth * 3) / 4, y: canvasHeight / 4 },
    { x: canvasWidth / 4, y: (canvasHeight * 3) / 4 },
    { x: (canvasWidth * 3) / 4, y: (canvasHeight * 3) / 4 },
    { x: canvasWidth / 2, y: canvasHeight / 2 },
  ];

  // Intentar desde cada punto de inicio
  for (const searchPoint of searchPoints) {
    let x = searchPoint.x;
    let y = searchPoint.y;
    let radius = 0;
    let angle = 0;
    const maxRadius = Math.max(canvasWidth, canvasHeight);

    // Buscar posición libre en espiral mejorada
    while (radius < maxRadius) {
      const testBounds: PostBounds = {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
        width: postWidth + margin,
        height: postHeight + margin,
      };

      // Verificar que esté dentro del canvas
      if (
        testBounds.x >= 0 &&
        testBounds.y >= 0 &&
        testBounds.x + postWidth <= canvasWidth &&
        testBounds.y + postHeight <= canvasHeight
      ) {
        // Verificar que no se superponga con ningún post existente
        const hasCollision = existingBounds.some((bounds) =>
          isOverlapping(testBounds, bounds)
        );

        if (!hasCollision) {
          return { x: testBounds.x, y: testBounds.y };
        }
      }

      // Mover en espiral con mejor algoritmo
      angle += 0.3; // Paso más pequeño para mejor cobertura
      radius = (angle * (postWidth + margin)) / (2 * Math.PI); // Radio basado en el tamaño del post
      x = searchPoint.x + radius * Math.cos(angle);
      y = searchPoint.y + radius * Math.sin(angle);
    }
  }

  // Si no se encuentra posición libre, buscar en una grilla sistemática
  const stepX = postWidth + margin;
  const stepY = postHeight + margin;

  for (let y = 0; y < canvasHeight - postHeight; y += stepY) {
    for (let x = 0; x < canvasWidth - postWidth; x += stepX) {
      const testBounds: PostBounds = {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
        width: postWidth + margin,
        height: postHeight + margin,
      };

      const hasCollision = existingBounds.some((bounds) =>
        isOverlapping(testBounds, bounds)
      );

      if (!hasCollision) {
        return { x: testBounds.x, y: testBounds.y };
      }
    }
  }

  // Último recurso: posición aleatoria que no se superponga
  for (let attempts = 0; attempts < 100; attempts++) {
    const randomX = Math.random() * (canvasWidth - postWidth);
    const randomY = Math.random() * (canvasHeight - postHeight);
    const testBounds: PostBounds = {
      x: Math.round(randomX / gridSize) * gridSize,
      y: Math.round(randomY / gridSize) * gridSize,
      width: postWidth + margin,
      height: postHeight + margin,
    };

    const hasCollision = existingBounds.some((bounds) =>
      isOverlapping(testBounds, bounds)
    );

    if (!hasCollision) {
      return { x: testBounds.x, y: testBounds.y };
    }
  }

  // Si todo falla, devolver una posición aleatoria
  return {
    x: Math.random() * (canvasWidth - postWidth),
    y: Math.random() * (canvasHeight - postHeight),
  };
}

// Ajustar posición para evitar superposición al mover
export function adjustPositionToAvoidCollision(
  newPosition: Position,
  movingPostId: string,
  existingPosts: Array<{ id: string; x: number; y: number }>,
  postWidth: number = 200,
  postHeight: number = 150,
  canvasWidth: number = 4000,
  canvasHeight: number = 3000
): Position {
  const margin = 30; // Aumentado para mejor separación

  // Filtrar el post que se está moviendo
  const otherPosts = existingPosts.filter((post) => post.id !== movingPostId);

  const adjustedPosition = { ...newPosition };
  const maxIterations = 10; // Evitar loops infinitos
  let iterations = 0;

  while (iterations < maxIterations) {
    const newBounds: PostBounds = {
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      width: postWidth + margin,
      height: postHeight + margin,
    };

    // Verificar colisiones con todos los posts
    let hasCollision = false;
    for (const post of otherPosts) {
      const postBounds: PostBounds = {
        x: post.x,
        y: post.y,
        width: postWidth + margin,
        height: postHeight + margin,
      };

      if (isOverlapping(newBounds, postBounds)) {
        hasCollision = true;

        // Calcular dirección para mover el post
        const centerX1 = newBounds.x + newBounds.width / 2;
        const centerY1 = newBounds.y + newBounds.height / 2;
        const centerX2 = postBounds.x + postBounds.width / 2;
        const centerY2 = postBounds.y + postBounds.height / 2;

        const deltaX = centerX1 - centerX2;
        const deltaY = centerY1 - centerY2;

        // Mover en la dirección opuesta a la colisión
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Mover horizontalmente
          adjustedPosition.x =
            deltaX > 0
              ? postBounds.x + postBounds.width + margin
              : postBounds.x - newBounds.width - margin;
        } else {
          // Mover verticalmente
          adjustedPosition.y =
            deltaY > 0
              ? postBounds.y + postBounds.height + margin
              : postBounds.y - newBounds.height - margin;
        }

        // Asegurar que esté dentro del canvas
        adjustedPosition.x = Math.max(
          0,
          Math.min(adjustedPosition.x, canvasWidth - postWidth)
        );
        adjustedPosition.y = Math.max(
          0,
          Math.min(adjustedPosition.y, canvasHeight - postHeight)
        );
        break;
      }
    }

    if (!hasCollision) {
      break;
    }

    iterations++;
  }

  return adjustedPosition;
}

// Detectar todos los post-its que se superponen
export function detectOverlappingPosts(
  posts: Array<{ id: string; x: number; y: number }>,
  postWidth: number = 200,
  postHeight: number = 150
): Array<{ post1: string; post2: string }> {
  const margin = 30;
  const overlaps: Array<{ post1: string; post2: string }> = [];

  for (let i = 0; i < posts.length; i++) {
    const post1 = posts[i];
    const bounds1: PostBounds = {
      x: post1.x,
      y: post1.y,
      width: postWidth + margin,
      height: postHeight + margin,
    };

    for (let j = i + 1; j < posts.length; j++) {
      const post2 = posts[j];
      const bounds2: PostBounds = {
        x: post2.x,
        y: post2.y,
        width: postWidth + margin,
        height: postHeight + margin,
      };

      if (isOverlapping(bounds1, bounds2)) {
        overlaps.push({ post1: post1.id, post2: post2.id });
      }
    }
  }

  return overlaps;
}

// Redistribuir post-its que se superponen
export function redistributeOverlappingPosts<
  T extends { id: string; x: number; y: number }
>(
  posts: T[],
  postWidth: number = 200,
  postHeight: number = 150,
  canvasWidth: number = 4000,
  canvasHeight: number = 3000
): T[] {
  const redistributed = [...posts];
  const overlaps = detectOverlappingPosts(redistributed, postWidth, postHeight);

  if (overlaps.length === 0) {
    return redistributed;
  }

  // Para cada post que se superpone, encontrar una nueva posición
  const processedIds = new Set<string>();

  for (const overlap of overlaps) {
    // Procesar ambos posts si no han sido procesados
    for (const postId of [overlap.post1, overlap.post2]) {
      if (processedIds.has(postId)) continue;

      const postIndex = redistributed.findIndex((p) => p.id === postId);
      if (postIndex === -1) continue;

      const post = redistributed[postIndex];

      // Encontrar una nueva posición libre para este post
      const otherPosts = redistributed.filter((p) => p.id !== postId);
      const newPosition = findFreePosition(
        otherPosts,
        postWidth,
        postHeight,
        canvasWidth,
        canvasHeight,
        post.x,
        post.y
      );

      redistributed[postIndex] = {
        ...post,
        x: newPosition.x,
        y: newPosition.y,
      };

      processedIds.add(postId);
    }
  }

  return redistributed;
}
