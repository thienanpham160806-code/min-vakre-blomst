import { Countdown } from "./countdown";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night px-6 text-white">
      <Link href="/vuon" className="btn absolute right-5 top-5 z-20 bg-white/10 text-white hover:bg-white/20">Vào vườn</Link>
      <Countdown />
    </main>
  );
}
