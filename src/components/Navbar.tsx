"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Cek Stok" },
  { href: "/bahan-masuk", label: "Bahan Masuk" },
  { href: "/resep-masuk", label: "Resep Masuk" },
  { href: "/resep-keluar", label: "Resep Keluar" },
  { href: "/setengah-jadi", label: "Setengah Jadi" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-6 h-14 overflow-x-auto">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.ico" alt="Logo" width={24} height={24} />
            <span className="font-bold text-stone-800 text-sm whitespace-nowrap">
              Soes Merdeka
            </span>
          </Link>

          <div className="h-5 w-px bg-stone-200 shrink-0" />

          {/* Nav links */}
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium whitespace-nowrap transition-colors pb-0.5 ${
                  isActive
                    ? "text-amber-600 border-b-2 border-amber-500"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
