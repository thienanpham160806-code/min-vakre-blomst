import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/patrick-hand/400.css";
import "@fontsource/dancing-script/600.css";
import "@fontsource/pacifico/400.css";
import { ThemeProvider } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "min vakre blomst",
  description: "Khu vườn kỷ niệm nhỏ của hai đứa 🌷",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f1e5",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("mvb-theme");if(t&&/^(ivory|morning|terracotta|rain|lavender|night)$/.test(t)){document.documentElement.setAttribute("data-theme",t);}if(localStorage.getItem("mvb-reduced-motion")==="reduce"){document.documentElement.setAttribute("data-reduced-motion","reduce");}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" data-theme="ivory" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
