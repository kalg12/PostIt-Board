"use client";

import React, { useState, useRef, useEffect } from "react";
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
  onDragStart?: () => void;
  onMove: (x: number, y: number) => void;
  onUpdate: (updates: Partial<Post>) => void;
  onDelete: () => void;
}

export default function PostItComponent({
  post,
  onDragStart,
  onMove,
  onUpdate,
  onDelete,
}: PostItComponentProps) {
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  const width = 200;
  const height = 150;
  const padding = 10;

  const canEdit =
    !!user && (user.id === post.authorId || user.role === "ADMIN");

  // Sincronizar posición del Group cuando cambia post.x o post.y
  useEffect(() => {
    if (groupRef.current && !isDragging) {
      groupRef.current.position({ x: post.x, y: post.y });
    }
  }, [post.x, post.y, isDragging]);

  const handleDragStart = () => {
    // Permitir drag a todos los usuarios (movimiento local, no se guarda en DB)
    setIsDragging(true);
    // Notificar al padre que se está arrastrando
    if (onDragStart) {
      onDragStart();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);

    const node = e.target;
    const group = node.getType() === "Group" ? node : node.getParent();
    if (!group || group.getType() !== "Group") return;

    const newX = group.x();
    const newY = group.y();

    // Guardar la nueva posición localmente (no se guarda en DB)
    onMove(newX, newY);
  };

  const handleDoubleClick = () => {
    if (!canEdit) return;

    const newContent = prompt("Editar contenido:", post.content);
    if (newContent && newContent !== post.content) {
      onUpdate({ content: newContent });
    }
  };

  const handleTextMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevenir que el drag del Group se active cuando se hace clic en un enlace
    const clickedText = e.target;
    const isURL = clickedText.getAttr("isURL");
    
    if (isURL) {
      // Detener la propagación para evitar que active el drag del Group
      e.cancelBubble = true;
      e.evt.stopPropagation();
    }
  };

  const handleTextClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Detener completamente la propagación para evitar que active el drag
    e.cancelBubble = true;
    e.evt.stopPropagation();
    e.evt.preventDefault();

    // Detener cualquier drag en curso
    const stage = e.target.getStage();
    if (stage) {
      stage.stopDrag();
    }

    const clickedText = e.target;
    const isURL = clickedText.getAttr("isURL");
    const url = clickedText.getAttr("url");

    if (isURL && url) {
      openURL(url);
    }
  };

  const handleTextTap = (e: Konva.KonvaEventObject<Event>) => {
    // onTap se dispara después de que se completa el gesto
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }

    const clickedText = e.target;
    const isURL = clickedText.getAttr("isURL");
    const url = clickedText.getAttr("url");

    if (isURL && url) {
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
                onMouseDown={handleTextMouseDown}
                onClick={handleTextClick}
                onTap={handleTextTap}
                style="pointer"
                listening={true}
                draggable={false}
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
                    onMouseDown={part.isURL ? handleTextMouseDown : undefined}
                    onClick={handleTextClick}
                    onTap={handleTextTap}
                    style={part.isURL ? "pointer" : "default"}
                    listening={part.isURL}
                    draggable={false}
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
                onMouseDown={part.isURL ? handleTextMouseDown : undefined}
                onClick={handleTextClick}
                onTap={handleTextTap}
                style={part.isURL ? "pointer" : "default"}
                listening={part.isURL}
                draggable={false}
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
      ref={groupRef}
      x={post.x}
      y={post.y}
      draggable={true}
      dragBoundFunc={(pos) => pos}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDblClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      opacity={isDragging ? 0.9 : 1}
      scaleX={isDragging ? 1.03 : 1}
      scaleY={isDragging ? 1.03 : 1}
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
        listening={false}
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
        listening={false}
        draggable={false}
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
        listening={false}
        draggable={false}
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
          listening={false}
        />
      )}
    </Group>
  );
}
