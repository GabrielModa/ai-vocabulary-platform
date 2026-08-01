import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./styles.css";

export const metadata: Metadata = {
  description: "Restricted operations surface for the vocabulary platform.",
  robots: { follow: false, index: false },
  title: {
    default: "Operator Access",
    template: "%s · Operator Access",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0d12",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
