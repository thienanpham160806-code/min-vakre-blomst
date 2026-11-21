import Link from "next/link";
import { IconGarden } from "@/components/icons";
import { Countdown } from "./countdown";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night px-4 py-16 text-[#f6efe4] sm:px-6">
      {/* Ánh trăng dịu phía trên khu vườn đêm */}
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(235, 198, 174, 0.55), transparent 70%)" }}
        aria-hidden
      />
      <Link
        href="/vuon"
        className="btn absolute right-4 top-4 z-20 min-h-10 border border-white/20 bg-white/10 px-3.5 text-sm text-[#f6efe4] backdrop-blur-sm hover:bg-white/20 sm:right-6 sm:top-6"
      >
        <IconGarden width={16} height={16} />
        <span>Vào vườn</span>
      </Link>
      <Countdown />
    </main>
  );
}
