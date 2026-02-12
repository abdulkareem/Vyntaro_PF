"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Txns" },
  { href: "/analytics", label: "Stats" },
  { href: "/bills", label: "Bills" },
  { href: "/settings", label: "Settings" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex justify-around py-2">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`text-sm ${
            path === t.href ? "text-indigo-600 font-semibold" : "text-gray-400"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
