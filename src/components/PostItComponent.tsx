"use client";

import React, { useState } from "react";
import { Group, Rect, Text } from "react-konva";
import Konva from "konva";
import { useAuthStore } from "@/store/useStore";
import { detectURLs, openURL } from "@/lib/url-utils";

interface Post {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  authorId: string;
  author: {
    name: string;
    group: string;
    career: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PostItComponentProps {
  post: Post;
  onMove: (newPos: { x: number; y: number }) => void;
  onUpdate: (updates: Partial<Post>) => void;
  onDelete: () => void;
  allPosts?: Post[];
}

// Función para detectar colisiones
const checkCollision = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
  margin: number = 10
) => {
  return !(
    rect1.x + rect1.width + margin < rect2.x ||
    rect2.x + rect2.width + margin < rect1.x ||
    rect1.y + rect1.height + margin < rect2.y ||
    rect2.y + rect2.height + margin < rect1.y
  );
};

// Función para encontrar una posición libre con animación suave
const findFreePositionSmooth = (
  currentPost: Post,
  allPosts: Post[],
  targetX: number,
  targetY: number,
  postWidth: number = 200,
  postHeight: number = 150
) => {
  const margin = 20; // Margen más generoso para separación
  const maxRadius = 250;
  const step = 25;

  // Primero intentar la posición objetivo
  const targetRect = {
    x: targetX,
    y: targetY,
    width: postWidth,
    height: postHeight,
  };
  let hasCollision = false;

  for (const post of allPosts) {
    if (post.id === currentPost.id) continue;
    const postRect = {
      x: post.x,
      y: post.y,
      width: postWidth,
      height: postHeight,
    };
    if (checkCollision(targetRect, postRect, margin)) {
      hasCollision = true;
      break;
    }
  }

  if (!hasCollision) {
    return { x: targetX, y: targetY };
  }

  // Buscar posiciones en un patrón más natural (menos agresivo)
  const directions = [
    { dx: 1, dy: 0 }, // derecha
    { dx: 0, dy: 1 }, // abajo
    { dx: -1, dy: 0 }, // izquierda
    { dx: 0, dy: -1 }, // arriba
    { dx: 1, dy: 1 }, // diagonal abajo-derecha
    { dx: -1, dy: 1 }, // diagonal abajo-izquierda
    { dx: 1, dy: -1 }, // diagonal arriba-derecha
    { dx: -1, dy: -1 }, // diagonal arriba-izquierda
  ];

  for (let distance = step; distance <= maxRadius; distance += step) {
    for (const direction of directions) {
      const x = targetX + direction.dx * distance;
      const y = targetY + direction.dy * distance;
      const testRect = { x, y, width: postWidth, height: postHeight };

      let collision = false;
      for (const post of allPosts) {
        if (post.id === currentPost.id) continue;
        const postRect = {
          x: post.x,
          y: post.y,
          width: postWidth,
          height: postHeight,
        };
        if (checkCollision(testRect, postRect, margin)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        return { x, y };
      }
    }
  }

  // Si no se encuentra posición libre, usar la original
  return { x: targetX, y: targetY };
};

export default function PostItComponent({
  post,
  onMove,
  onUpdate,
  onDelete,
  allPosts = [],
}: PostItComponentProps) {
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);

  const width = 200;
  const height = 150;
  const padding = 10;

  const canEdit =
    !!user && (user.id === post.authorId || user.role === "ADMIN");

  const handleDragStart = () => {
    setIsDragging(true);

    // Si no puede editar, mostrar feedback visual temporal
    if (!canEdit) {
      // Agregar un pequeño shake effect para indicar que no se puede mover
      setTimeout(() => {
        // El post-it volverá a su posición original en handleDragEnd
      }, 100);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);

    if (!canEdit) {
      // Si no puede editar, regresar a la posición original
      e.target.x(post.x);
      e.target.y(post.y);
      return;
    }

    const newX = e.target.x();
    const newY = e.target.y();

    // Encontrar posición libre si hay otros posts
    if (allPosts.length > 0) {
      const freePosition = findFreePositionSmooth(
        post,
        allPosts,
        newX,
        newY,
        width,
        height
      );

      // Actualizar posición del nodo si es diferente (animación suave a posición libre)
      if (freePosition.x !== newX || freePosition.y !== newY) {
        e.target.to({
          x: freePosition.x,
          y: freePosition.y,
          duration: 0.3,
        });
      }

      onMove(freePosition);
    } else {
      onMove({ x: newX, y: newY });
    }
  };

  const handleDoubleClick = () => {
    if (!canEdit) return;

    const newContent = prompt("Editar contenido:", post.content);
    if (newContent && newContent !== post.content) {
      onUpdate({ content: newContent });
    }
  };

  const handleTextClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Solo procesar si no estamos arrastrando
    if (isDragging) return;

    const clickedText = e.target;
    const isURL = clickedText.getAttr("isURL");
    const url = clickedText.getAttr("url");

    if (isURL && url) {
      e.cancelBubble = true; // Prevenir que se propague el evento
      openURL(url);
    }
  };

  const handleRightClick = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (!canEdit) return;

    const shouldDelete = confirm(
      "¿Estás seguro de que quieres eliminar este post-it?"
    );
    if (shouldDelete) {
      onDelete();
    }
  };

  const renderTextWithURLs = () => {
    const textParts = detectURLs(post.content);
    const textElements: React.ReactNode[] = [];
    let currentY = padding;
    const lineHeight = 16;
    const maxWidth = width - padding * 2;
    const maxContentHeight = height - 70; // Más espacio para autor/carrera
    const charWidth = 7; // Ancho promedio por carácter

    let elementIndex = 0;

    textParts.forEach((part) => {
      if (currentY + lineHeight > padding + maxContentHeight) {
        return; // No hay más espacio
      }

      // Dividir el texto en líneas
      const lines = part.text.split("\n");

      lines.forEach((line, lineIndex) => {
        if (currentY + lineHeight > padding + maxContentHeight) {
          return; // No hay más espacio
        }

        // Para URLs largas, cortarlas inteligentemente
        if (part.isURL && line.length * charWidth > maxWidth) {
          // Cortar URL larga en múltiples líneas
          const maxCharsPerLine = Math.floor(maxWidth / charWidth) - 2;
          let currentLine = "";
          let i = 0;

          while (
            i < line.length &&
            currentY + lineHeight <= padding + maxContentHeight
          ) {
            currentLine = line.slice(i, i + maxCharsPerLine);

            // Si no es la última parte, agregar "..."
            if (i + maxCharsPerLine < line.length) {
              currentLine += "...";
            }

            textElements.push(
              <Text
                key={`${elementIndex++}`}
                text={currentLine}
                x={padding}
                y={currentY}
                fontSize={13}
                fontFamily="Arial"
                fill="#2563eb"
                textDecoration="underline"
                isURL={part.isURL}
                url={part.url}
                onClick={handleTextClick}
                style="pointer"
              />
            );

            currentY += lineHeight;
            i += maxCharsPerLine;

            // Solo mostrar las primeras 2 líneas de una URL larga
            if (i > maxCharsPerLine) break;
          }
        } else {
          // Texto normal - dividir por palabras
          const words = line.split(" ");
          let currentLine = "";

          words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const estimatedWidth = testLine.length * charWidth;

            if (estimatedWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              // Crear elemento de texto para la línea actual
              if (
                currentLine &&
                currentY + lineHeight <= padding + maxContentHeight
              ) {
                textElements.push(
                  <Text
                    key={`${elementIndex++}`}
                    text={currentLine}
                    x={padding}
                    y={currentY}
                    fontSize={13}
                    fontFamily="Arial"
                    fill={part.isURL ? "#2563eb" : "#333"}
                    textDecoration={part.isURL ? "underline" : ""}
                    isURL={part.isURL}
                    url={part.url}
                    onClick={handleTextClick}
                    style={part.isURL ? "pointer" : "default"}
                  />
                );
                currentY += lineHeight;
              }
              currentLine = word;
            }
          });

          // Agregar la línea restante
          if (
            currentLine &&
            currentY + lineHeight <= padding + maxContentHeight
          ) {
            textElements.push(
              <Text
                key={`${elementIndex++}`}
                text={currentLine}
                x={padding}
                y={currentY}
                fontSize={13}
                fontFamily="Arial"
                fill={part.isURL ? "#2563eb" : "#333"}
                textDecoration={part.isURL ? "underline" : ""}
                isURL={part.isURL}
                url={part.url}
                onClick={handleTextClick}
                style={part.isURL ? "pointer" : "default"}
              />
            );
            currentY += lineHeight;
          }
        }

        // Agregar espacio entre líneas originales
        if (lineIndex < lines.length - 1) {
          currentY += 2;
        }
      });
    });

    return textElements;
  };

  return (
    <Group
      x={post.x}
      y={post.y}
      draggable={true} // Permitir arrastre para todos los post-its
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDblClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      shadowColor="black"
      shadowBlur={isDragging ? 10 : 5}
      shadowOffset={{ x: isDragging ? 5 : 3, y: isDragging ? 5 : 3 }}
      shadowOpacity={0.3}
      opacity={isDragging ? 0.8 : 1}
      scaleX={isDragging ? 1.05 : 1}
      scaleY={isDragging ? 1.05 : 1}
    >
      {/* Fondo del post-it */}
      <Rect
        width={width}
        height={height}
        fill={post.color}
        stroke={isDragging ? (canEdit ? "#22c55e" : "#ef4444") : "#ddd"}
        strokeWidth={isDragging ? 2 : 1}
        cornerRadius={5}
      />

      {/* Contenido del post-it con URLs clickeables */}
      {renderTextWithURLs()}

      {/* Información del autor */}
      <Text
        text={`${post.author.name} - ${post.author.group}`}
        x={padding}
        y={height - 45}
        width={width - padding * 2}
        fontSize={10}
        fontFamily="Arial"
        fill="#666"
        fontStyle="italic"
      />

      {/* Carrera */}
      <Text
        text={post.author.career}
        x={padding}
        y={height - 25}
        width={width - padding * 2}
        fontSize={9}
        fontFamily="Arial"
        fill="#888"
      />

      {/* Indicador de propiedad */}
      {canEdit && (
        <Rect
          x={width - 15}
          y={5}
          width={10}
          height={10}
          fill={user?.role === "ADMIN" ? "#ef4444" : "#22c55e"}
          cornerRadius={2}
        />
      )}
    </Group>
  );
}
