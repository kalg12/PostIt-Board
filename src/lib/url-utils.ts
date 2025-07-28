// Función para detectar URLs en texto
export function detectURLs(
  text: string
): Array<{ text: string; isURL: boolean; url?: string }> {
  // Regex para detectar URLs
  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

  const parts: Array<{ text: string; isURL: boolean; url?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Agregar texto antes de la URL
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isURL: false,
      });
    }

    // Agregar la URL
    let url = match[0];
    // Si no empieza con http, agregar https
    if (!url.startsWith("http")) {
      if (url.startsWith("www.")) {
        url = "https://" + url;
      } else {
        url = "https://" + url;
      }
    }

    parts.push({
      text: match[0],
      isURL: true,
      url: url,
    });

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isURL: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, isURL: false }];
}

// Función para abrir URL en nueva pestaña
export function openURL(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
