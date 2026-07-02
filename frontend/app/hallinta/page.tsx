"use client";

import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";

export default function HallintaPage() {
  return (
    <RoleGuard role="esimies">
      <HallintaContent />
    </RoleGuard>
  );
}

function HallintaContent() {
  const { user, logout } = useAuth();

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading italic text-2xl text-sage-800">Hallinta</h1>
          <p className="text-sm text-ink-500">{user?.full_name} · Esimies</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/kalenteri" className="text-sm text-sage-700 hover:underline">
            Kalenteri
          </Link>
          <button onClick={logout} className="text-sm text-ink-500 hover:text-ink-800">
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/hallinta/asiakkaat"
          className="block bg-cream-50 border border-cream-200 shadow-soft rounded-3xl p-6 hover:border-sage-400 hover:-translate-y-0.5 transition-all"
        >
          <h2 className="font-heading text-lg text-sage-800 mb-1">Asiakkaat</h2>
          <p className="text-sm text-ink-500">
            Lisää asiakkaita ja aikatauluta kotihoidon käyntejä
          </p>
        </Link>
        <Link
          href="/hallinta/kayttajat"
          className="block bg-cream-50 border border-cream-200 shadow-soft rounded-3xl p-6 hover:border-sage-400 hover:-translate-y-0.5 transition-all"
        >
          <h2 className="font-heading text-lg text-sage-800 mb-1">Käyttäjät</h2>
          <p className="text-sm text-ink-500">
            Hallitse työntekijöitä ja omaisia sekä liitä heidät asiakkaisiin
          </p>
        </Link>
      </div>
    </main>
  );
}
