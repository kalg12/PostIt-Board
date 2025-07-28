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
  const margin = 20; // Espacio mínimo entre post-its
  const gridSize = 50; // Tamaño de la grilla para posicionamiento

  // Convertir posts existentes a bounds
  const existingBounds = existingPosts.map((post) => ({
    x: post.x,
    y: post.y,
    width: postWidth + margin,
    height: postHeight + margin,
  }));

  // Buscar posición libre en espiral desde el punto inicial
  let x = startX;
  let y = startY;
  let radius = 0;
  let angle = 0;

  while (radius < Math.max(canvasWidth, canvasHeight) / 2) {
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
      testBounds.x + postWidth < canvasWidth &&
      testBounds.y + postHeight < canvasHeight
    ) {
      // Verificar que no se superponga con ningún post existente
      const hasCollision = existingBounds.some((bounds) =>
        isOverlapping(testBounds, bounds)
      );

      if (!hasCollision) {
        return { x: testBounds.x, y: testBounds.y };
      }
    }

    // Mover en espiral
    angle += 0.5;
    radius += 2;
    x = startX + radius * Math.cos(angle);
    y = startY + radius * Math.sin(angle);
  }

  // Si no se encuentra posición libre, devolver una posición aleatoria
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
  postHeight: number = 150
): Position {
  const margin = 10;

  // Filtrar el post que se está moviendo
  const otherPosts = existingPosts.filter((post) => post.id !== movingPostId);

  const newBounds: PostBounds = {
    x: newPosition.x,
    y: newPosition.y,
    width: postWidth + margin,
    height: postHeight + margin,
  };

  // Verificar colisiones
  for (const post of otherPosts) {
    const postBounds: PostBounds = {
      x: post.x,
      y: post.y,
      width: postWidth + margin,
      height: postHeight + margin,
    };

    if (isOverlapping(newBounds, postBounds)) {
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
        newPosition.x =
          deltaX > 0
            ? postBounds.x + postBounds.width + margin
            : postBounds.x - newBounds.width - margin;
      } else {
        // Mover verticalmente
        newPosition.y =
          deltaY > 0
            ? postBounds.y + postBounds.height + margin
            : postBounds.y - newBounds.height - margin;
      }

      // Actualizar bounds para la nueva posición
      newBounds.x = newPosition.x;
      newBounds.y = newPosition.y;
    }
  }

  return newPosition;
}
