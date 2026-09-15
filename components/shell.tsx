import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/programme", label: "Programme" },
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
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Rehab log
          </p>
          <h1 className="font-display text-3xl tracking-tight text-ink">
            {title ?? "ACL tracker"}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-muted underline decoration-line underline-offset-4"
          >
            Log out
          </button>
        </form>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-4 text-center text-sm font-medium text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
