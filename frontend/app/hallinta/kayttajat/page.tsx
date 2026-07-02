"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import { Role } from "@/lib/auth";
import { UserOut, Asiakas } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  omainen: "Omainen",
  tyontekija: "Työntekijä",
  esimies: "Esimies",
};

export default function KayttajatPage() {
  return (
    <RoleGuard role="esimies">
      <KayttajatContent />
    </RoleGuard>
  );
}

function KayttajatContent() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [asiakkaat, setAsiakkaat] = useState<Asiakas[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, asiakkaatRes] = await Promise.all([
        api.get<UserOut[]>("/users/"),
        api.get<Asiakas[]>("/asiakkaat/"),
      ]);
      setUsers(usersRes.data);
      setAsiakkaat(asiakkaatRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(user: UserOut) {
    await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
    load();
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading italic text-2xl text-sage-800">Käyttäjät</h1>
          <Link href="/hallinta" className="text-sm text-sage-700 hover:underline">
            ← Hallinta
          </Link>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-xl bg-sage-600 text-white text-sm font-medium px-4 py-2 hover:bg-sage-700 transition-colors"
        >
          {showCreateForm ? "Peruuta" : "+ Uusi käyttäjä"}
        </button>
      </header>

      {showCreateForm && (
        <CreateUserForm
          onCreated={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-ink-500 text-sm">Ladataan...</p>
      ) : (
        <div className="bg-cream-50 border border-cream-200 shadow-soft rounded-3xl divide-y divide-cream-200">
          {users.map((u) => (
            <div key={u.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">
                    {u.full_name}{" "}
                    <span className="text-xs text-ink-500">({roleLabels[u.role]})</span>
                    {!u.is_active && (
                      <span className="ml-2 text-xs text-clay-600">Ei aktiivinen</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {u.role !== "esimies" && (
                    <button
                      onClick={() =>
                        setExpandedUserId(expandedUserId === u.id ? null : u.id)
                      }
                      className="text-sm text-sage-700 hover:underline"
                    >
                      {expandedUserId === u.id ? "Piilota liitokset" : "Asiakasliitokset"}
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-sm text-ink-500 hover:text-ink-800"
                  >
                    {u.is_active ? "Poista käytöstä" : "Aktivoi"}
                  </button>
                </div>
              </div>
              {expandedUserId === u.id && (
                <UserLinks user={u} allAsiakkaat={asiakkaat} />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("tyontekija");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/users/", {
        email,
        password,
        full_name: fullName,
        role,
        phone: phone || null,
      });
      onCreated();
    } catch {
      setError("Käyttäjän luonti epäonnistui (sähköposti voi olla jo käytössä)");
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
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
        >
          <option value="tyontekija">Työntekijä</option>
          <option value="omainen">Omainen</option>
          <option value="esimies">Esimies</option>
        </select>
        <input
          placeholder="Sähköposti"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
        />
        <input
          placeholder="Salasana"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
        />
        <input
          placeholder="Puhelin (valinnainen)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 sm:col-span-2"
        />
      </div>
      {error && <p className="text-sm text-clay-600">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !email || !password || !fullName}
        className="rounded-xl bg-sage-600 text-white text-sm font-medium px-4 py-2 hover:bg-sage-700 disabled:opacity-50 transition-colors"
      >
        Luo käyttäjä
      </button>
    </div>
  );
}

function UserLinks({ user, allAsiakkaat }: { user: UserOut; allAsiakkaat: Asiakas[] }) {
  const [links, setLinks] = useState<Asiakas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Asiakas[]>(`/users/${user.id}/links`);
      setLinks(res.data);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addLink() {
    if (!selected) return;
    await api.post(`/users/${user.id}/links`, { asiakas_id: Number(selected) });
    setSelected("");
    load();
  }

  async function removeLink(asiakasId: number) {
    await api.delete(`/users/${user.id}/links/${asiakasId}`);
    load();
  }

  const linkableAsiakkaat = allAsiakkaat.filter(
    (a) => !links.some((l) => l.id === a.id)
  );

  return (
    <div className="mt-3 pl-4 border-l-2 border-cream-200 space-y-2">
      {loading ? (
        <p className="text-sm text-ink-500">Ladataan...</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-ink-500">Ei liitettyjä asiakkaita.</p>
      ) : (
        <ul className="space-y-1">
          {links.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-900">{a.full_name}</span>
              <button
                onClick={() => removeLink(a.id)}
                className="text-clay-600 hover:underline text-xs"
              >
                Poista
              </button>
            </li>
          ))}
        </ul>
      )}
      {linkableAsiakkaat.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-xl border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900"
          >
            <option value="">Valitse asiakas...</option>
            {linkableAsiakkaat.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
          <button
            onClick={addLink}
            disabled={!selected}
            className="text-sage-700 hover:underline text-sm disabled:opacity-50"
          >
            + Liitä
          </button>
        </div>
      )}
    </div>
  );
}
