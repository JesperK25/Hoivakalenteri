"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/kalenteri");
    } catch {
      setError("Väärä sähköposti tai salasana");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-cream-50 rounded-3xl shadow-soft border border-cream-200 p-8 animate-fade-in">
        <h1 className="font-heading italic text-2xl text-sage-800 mb-1">Hoivakalenteri</h1>
        <p className="text-sm text-ink-500 mb-6">Kirjaudu sisään jatkaaksesi</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Sähköposti
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400"
              placeholder="esimies@hoivakalenteri.fi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Salasana
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400"
            />
          </div>
          {error && <p className="text-sm text-clay-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-sage-600 text-white text-sm font-medium py-2 hover:bg-sage-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Kirjaudutaan..." : "Kirjaudu"}
          </button>
        </form>
        <p className="text-xs text-ink-300 mt-6">
          Demo: esimies@hoivakalenteri.fi / tyontekija1@hoivakalenteri.fi /
          omainen1@hoivakalenteri.fi (salasana: demo1234)
        </p>
      </div>
    </main>
  );
}
