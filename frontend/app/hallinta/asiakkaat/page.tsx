"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import { Asiakas, UserOut } from "@/lib/types";

export default function AsiakkaatPage() {
  return (
    <RoleGuard role="esimies">
      <AsiakkaatContent />
    </RoleGuard>
  );
}

function AsiakkaatContent() {
  const [asiakkaat, setAsiakkaat] = useState<Asiakas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Asiakas[]>("/asiakkaat/");
      setAsiakkaat(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading italic text-2xl text-sage-800">Asiakkaat</h1>
          <Link href="/hallinta" className="text-sm text-sage-700 hover:underline">
            ← Hallinta
          </Link>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-xl bg-sage-600 text-white text-sm font-medium px-4 py-2 hover:bg-sage-700 transition-colors"
        >
          {showCreateForm ? "Peruuta" : "+ Uusi asiakas"}
        </button>
      </header>

      {showCreateForm && (
        <CreateAsiakasForm
          onCreated={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-ink-500 text-sm">Ladataan...</p>
      ) : (
        <div className="space-y-3">
          {asiakkaat.map((a) => (
            <div key={a.id} className="bg-cream-50 border border-cream-200 shadow-soft rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">{a.full_name}</p>
                  {a.address && <p className="text-sm text-ink-500">{a.address}</p>}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  className="text-sm text-sage-700 hover:underline"
                >
                  {expandedId === a.id ? "Piilota" : "Aikatauluta käynti"}
                </button>
              </div>
              {expandedId === a.id && <ScheduleVisitForm asiakas={a} />}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function CreateAsiakasForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api.post("/asiakkaat/", {
        full_name: fullName,
        address: address || null,
        notes: notes || null,
      });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-cream-50 border border-cream-200 shadow-soft rounded-3xl p-4 mb-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          placeholder="Koko nimi"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
        />
        <input
          placeholder="Osoite (valinnainen)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
        />
        <textarea
          placeholder="Muistiinpanot (valinnainen)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 sm:col-span-2"
          rows={2}
        />
      </div>
      <button
        onClick={submit}
        disabled={submitting || !fullName}
        className="rounded-xl bg-sage-600 text-white text-sm font-medium px-4 py-2 hover:bg-sage-700 disabled:opacity-50 transition-colors"
      >
        Luo asiakas
      </button>
    </div>
  );
}

function ScheduleVisitForm({ asiakas }: { asiakas: Asiakas }) {
  const [tyontekijat, setTyontekijat] = useState<UserOut[]>([]);
  const [tyontekijaId, setTyontekijaId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .get<UserOut[]>(`/users/?asiakas_id=${asiakas.id}&role=tyontekija`)
      .then((res) => setTyontekijat(res.data));
  }, [asiakas.id]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post("/kaynnit/", {
        asiakas_id: asiakas.id,
        tyontekija_id: tyontekijaId ? Number(tyontekijaId) : null,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      setSuccess(true);
    } catch {
      setError("Käynnin luonti epäonnistui");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 pl-4 border-l-2 border-cream-200 space-y-2">
      {tyontekijat.length === 0 && (
        <p className="text-sm text-clay-600">
          Ei liitettyjä työntekijöitä. Liitä työntekijä tälle asiakkaalle Käyttäjät-sivulla ennen
          käynnin aikatauluttamista.
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          value={tyontekijaId}
          onChange={(e) => setTyontekijaId(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900 col-span-2 sm:col-span-1"
        >
          <option value="">Ei nimetty</option>
          {tyontekijat.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900"
        />
      </div>
      {error && <p className="text-sm text-clay-600">{error}</p>}
      {success && <p className="text-sm text-sage-700">Käynti lisätty.</p>}
      <button
        onClick={submit}
        disabled={submitting || !date}
        className="rounded-xl bg-sage-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-sage-700 disabled:opacity-50 transition-colors"
      >
        Lisää käynti
      </button>
    </div>
  );
}
