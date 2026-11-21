import { Countdown } from "./countdown";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night px-6 text-white">
      <Countdown />
    </main>
  );
}
