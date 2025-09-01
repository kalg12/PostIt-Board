export const COLORS = [
  "#FBBF24", // Amarillo
  "#F87171", // Rojo claro
  "#60A5FA", // Azul claro
  "#34D399", // Verde claro
  "#A78BFA", // Púrpura claro
  "#FB7185", // Rosa claro
  "#F59E0B", // Naranja
  "#4ADE80", // Verde
  "#38BDF8", // Azul cielo
  "#C084FC", // Púrpura
];

export const getRandomColor = () => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
