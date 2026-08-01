import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./styles.css";

export const metadata: Metadata = {
  description: "Personal vocabulary becomes contextual English practice.",
  title: {
    default: "Vocabulary Platform",
    template: "%s · Vocabulary Platform",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090b10",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
