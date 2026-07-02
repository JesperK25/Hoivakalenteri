"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Kaynti } from "@/lib/types";
import Calendar from "@/components/Calendar";
import KayntiDetailModal from "@/components/KayntiDetailModal";

const roleLabels: Record<string, string> = {
  omainen: "Omainen",
  tyontekija: "Työntekijä",
  esimies: "Esimies",
};

export default function KalenteriPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [kaynnit, setKaynnit] = useState<Kaynti[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Kaynti | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const fetchKaynnit = useCallback(async () => {
    setFetching(true);
    try {
      const res = await api.get<Kaynti[]>("/kaynnit/");
      setKaynnit(res.data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchKaynnit();
  }, [user, fetchKaynnit]);

  if (loading || !user) {
    return (
      <main className="flex-1 flex items-center justify-center text-ink-500">
        Ladataan...
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading italic text-2xl text-sage-800">Kalenteri</h1>
          <p className="text-sm text-ink-500">
            {user.full_name} · {roleLabels[user.role]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "esimies" && (
            <a href="/hallinta" className="text-sm text-sage-700 hover:underline">
              Hallinta
            </a>
          )}
          <button onClick={logout} className="text-sm text-ink-500 hover:text-ink-800">
            Kirjaudu ulos
          </button>
        </div>
      </header>

      {fetching ? (
        <p className="text-ink-500 text-sm">Ladataan käyntejä...</p>
      ) : kaynnit.length === 0 ? (
        <p className="text-ink-500 text-sm">Ei käyntejä näytettäväksi.</p>
      ) : (
        <Calendar kaynnit={kaynnit} viewerRole={user.role} onSelectKaynti={setSelected} />
      )}

      {selected && (
        <KayntiDetailModal
          kaynti={selected}
          onClose={() => setSelected(null)}
          onChanged={fetchKaynnit}
        />
      )}
    </main>
  );
}
