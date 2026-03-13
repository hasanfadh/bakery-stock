"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../assets/logo.png";

const navItems = [
  { href: "/", label: "Cek Stok" },
  { href: "/bahan-masuk", label: "Bahan Masuk" },
  { href: "/resep-masuk", label: "Resep Masuk" },
  { href: "/resep-keluar", label: "Resep Keluar" },
  { href: "/koreksi", label: "Koreksi" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-1 h-14">
          {/* Logo */}
          <div className="mr-4 flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-auto h-6" />
          </div>

          <div className="w-px h-8 bg-stone-200 mr-3 hidden sm:block" />

          {/* Nav Links */}
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-amber-500 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
