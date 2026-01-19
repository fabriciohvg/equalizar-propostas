"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/propostas", label: "Propostas" },
  { href: "/eap-padrao", label: "EAP Padrão" },
  { href: "/equalizacao", label: "Equalização" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto flex h-12 items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Equalização de Propostas
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
