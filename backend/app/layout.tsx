import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habla Bien - Entrenador de comunicación",
  description:
    "Backend de análisis para práctica de escritura argumentativa y exposición oral.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
