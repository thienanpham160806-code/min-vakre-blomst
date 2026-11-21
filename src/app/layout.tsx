import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/patrick-hand/400.css";
import "@fontsource/dancing-script/600.css";
import "@fontsource/pacifico/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "min vakre blomst",
  description: "🌷",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf6ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
