"use client";

import React, { useState } from "react";
import { Group, Rect, Text, Line } from "react-konva";
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
  onMove: (x: number, y: number) => void;
  onUpdate: (updates: Partial<Post>) => void;
  onDelete: () => void;
}

export default function PostItComponent({
  post,
  onMove,
  onUpdate,
  onDelete,
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

    // Movimiento local: siempre permitir mover y guardar solo en local
    const newX = e.target.x();
    const newY = e.target.y();
    onMove(newX, newY);
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
      draggable={true}
      dragBoundFunc={(pos) => pos} // Permite movimiento inmediato, sin delay
      onDragMove={() => setIsDragging(true)} // Marca como arrastrando para feedback visual
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDblClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      opacity={isDragging ? 0.85 : 1}
      scaleX={isDragging ? 1.07 : 1}
      scaleY={isDragging ? 1.07 : 1}
    >
      {/* Sombra */}
      <Rect
        x={6}
        y={6}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.10)"
        cornerRadius={14}
        listening={false}
      />
      {/* Fondo Post-it */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={post.color || "#FFFB7D"}
        stroke="#f3f4f6"
        strokeWidth={2}
        cornerRadius={14}
        shadowColor="#000"
        shadowBlur={12}
        shadowOffset={{ x: 4, y: 4 }}
        shadowOpacity={0.18}
      />
      {/* Doble de papel */}
      <Line
        points={[width - 30, height, width, height, width, height - 30]}
        closed
        fill="#fff"
        opacity={0.7}
        listening={false}
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
        fontFamily="Comic Sans MS, 'Indie Flower', cursive, Arial"
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
        fontFamily="Comic Sans MS, 'Indie Flower', cursive, Arial"
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
