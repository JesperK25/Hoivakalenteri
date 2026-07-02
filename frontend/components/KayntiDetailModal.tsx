"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Kaynti, PoikkeusSyy } from "@/lib/types";

const syyLabels: Record<PoikkeusSyy, string> = {
  omainen_hakee: "Omainen hakee asiakkaan",
  asiakas_sairaalassa: "Asiakas sairaalassa",
  muu: "Muu syy",
};

export default function KayntiDetailModal({
  kaynti,
  onClose,
  onChanged,
}: {
  kaynti: Kaynti;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [syy, setSyy] = useState<PoikkeusSyy>("omainen_hakee");
  const [kuvaus, setKuvaus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFutureOrToday = kaynti.date >= new Date().toISOString().slice(0, 10);
  const canCreatePoikkeus =
    user?.role === "omainen" && !kaynti.poikkeus && isFutureOrToday;
  const canDeletePoikkeus =
    !!kaynti.poikkeus &&
    (user?.role === "esimies" || user?.id === kaynti.poikkeus.luonut_kayttaja_id);

  async function submitPoikkeus() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/poikkeukset/", { kaynti_id: kaynti.id, syy, kuvaus: kuvaus || null });
      onChanged();
      onClose();
    } catch {
      setError("Poikkeuksen luonti epäonnistui");
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePoikkeus() {
    if (!kaynti.poikkeus) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/poikkeukset/${kaynti.poikkeus.id}`);
      onChanged();
      onClose();
    } catch {
      setError("Poikkeuksen poistaminen epäonnistui");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-cream-50 rounded-3xl shadow-soft w-full max-w-md p-6 border border-cream-200 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-heading text-lg text-sage-800">{kaynti.asiakas.full_name}</h2>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600">
            ✕
          </button>
        </div>

        <dl className="text-sm space-y-1 mb-4">
          <div className="flex justify-between">
            <dt className="text-ink-500">Ajankohta</dt>
            <dd className="text-ink-900">
              {kaynti.date} {kaynti.start_time.slice(0, 5)}–{kaynti.end_time.slice(0, 5)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Työntekijä</dt>
            <dd className="text-ink-900">{kaynti.tyontekija?.full_name ?? "Ei nimetty"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Tila</dt>
            <dd className="text-ink-900 capitalize">{kaynti.status}</dd>
          </div>
        </dl>

        {kaynti.poikkeus && (
          <div className="rounded-xl bg-clay-50 border border-clay-200 p-3 text-sm mb-4">
            <p className="font-medium text-clay-800">{syyLabels[kaynti.poikkeus.syy]}</p>
            {kaynti.poikkeus.kuvaus && (
              <p className="text-clay-600 mt-1">{kaynti.poikkeus.kuvaus}</p>
            )}
            {canDeletePoikkeus && (
              <button
                onClick={deletePoikkeus}
                disabled={submitting}
                className="mt-2 text-clay-600 underline text-xs disabled:opacity-50"
              >
                Peruuta poikkeus
              </button>
            )}
          </div>
        )}

        {canCreatePoikkeus && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-xl bg-sage-600 text-white text-sm font-medium py-2 hover:bg-sage-700 transition-colors"
          >
            Merkitse ettei käyntiä tarvita
          </button>
        )}

        {canCreatePoikkeus && showForm && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Syy</label>
              <select
                value={syy}
                onChange={(e) => setSyy(e.target.value as PoikkeusSyy)}
                className="w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
              >
                {Object.entries(syyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {syy === "muu" && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Kuvaus</label>
                <textarea
                  value={kuvaus}
                  onChange={(e) => setKuvaus(e.target.value)}
                  className="w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
                  rows={2}
                />
              </div>
            )}
            {error && <p className="text-sm text-clay-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={submitPoikkeus}
                disabled={submitting || (syy === "muu" && !kuvaus)}
                className="flex-1 rounded-xl bg-sage-600 text-white text-sm font-medium py-2 hover:bg-sage-700 disabled:opacity-50 transition-colors"
              >
                Tallenna
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-cream-200 text-ink-700 text-sm font-medium py-2 hover:bg-cream-100"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
