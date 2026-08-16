import Link from "next/link";

const LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "Nutzungsbedingungen" },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-3xl px-4 pb-28 pt-10 sm:pb-10">
      <div className="divider mb-5" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/35">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-white/70">
            {link.label}
          </Link>
        ))}
        <span className="ml-auto">Terrassenlobby</span>
      </div>
    </footer>
  );
}
