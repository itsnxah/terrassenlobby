/**
 * Weicher, animierter Farbnebel im Hintergrund.
 * Liegt fix hinter allem und sorgt dafür, dass die Glasflächen
 * darüber etwas zum "Durchscheinen" haben.
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      {/* Pink → Violett → Blau: die drei Eckpunkte der Palette */}
      <div className="absolute -left-[15%] -top-[20%] h-[65vh] w-[65vh] animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(255,77,151,0.5),transparent_65%)] blur-3xl" />
      <div
        className="absolute -right-[18%] top-[8%] h-[60vh] w-[60vh] animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(176,107,255,0.45),transparent_65%)] blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-22%] left-[18%] h-[62vh] w-[62vh] animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(91,157,255,0.42),transparent_65%)] blur-3xl"
        style={{ animationDelay: "-14s" }}
      />
      {/* Feines Raster für Tiefe */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, #000 20%, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />
    </div>
  );
}
