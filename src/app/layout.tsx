import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostIt - Board",
  description: "Share your homework with community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
