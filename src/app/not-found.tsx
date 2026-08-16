import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass glass-sheen relative mx-auto mt-10 flex max-w-md animate-riseIn flex-col items-center gap-4 p-10 text-center">
      <span className="animate-floaty text-6xl">🫥</span>
      <div>
        <h1 className="text-xl font-bold">Diese Lobby gibt es nicht (mehr).</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Vielleicht ist die Party vorbei oder der Link stimmt nicht.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        Zurück zum Feed
      </Link>
    </div>
  );
}
