import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Session" },
  { href: "/history", label: "History" },
  { href: "/programme", label: "Programmes" },
] as const;

export function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-28 pt-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-accent">
            Club Serginho
          </p>
          <h1 className="chrome mt-1 font-display text-4xl uppercase italic tracking-tight">
            {title ?? "Session"}
          </h1>
          <span className="stripes mt-2" aria-hidden />
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="whitespace-nowrap text-sm uppercase tracking-[0.12em] text-muted underline decoration-line underline-offset-4"
          >
            Log out
          </button>
        </form>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 border-t-2 border-accent bg-paper/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-4 text-center font-display text-base uppercase tracking-[0.12em] text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
