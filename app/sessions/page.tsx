"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Session = {
  id: string;
  session_date: string;
  session_type: string;
  rpe: number;
  finger_pain: number;
  skin: number;
  grade_label: string;
  notes: string | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchSessions() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("sessions")
      .select("id, session_date, session_type, rpe, finger_pain, skin, grade_label, notes")
      .order("session_date", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setSessions([]);
    } else {
      setSessions(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Session History</h1>
            <p className="text-gray-600">View your logged bouldering sessions.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login-session"
              className="rounded-xl bg-black px-4 py-2 text-white text-center"
            >
              Log Session
            </Link>

            <button
              onClick={fetchSessions}
              disabled={loading}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border p-6 text-gray-600">
            Loading sessions...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-500 p-6 text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && sessions.length === 0 && (
          <div className="rounded-2xl border p-6 text-gray-600">
            No sessions logged yet.
          </div>
        )}

        {!loading && !errorMessage && sessions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-black">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">RPE</th>
                  <th className="p-3">Finger Pain</th>
                  <th className="p-3">Skin</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="p-3">{session.session_date}</td>
                    <td className="p-3 capitalize">{session.session_type}</td>
                    <td className="p-3 capitalize">{session.grade_label}</td>
                    <td className="p-3">{session.rpe}</td>
                    <td className="p-3">{session.finger_pain}</td>
                    <td className="p-3">{session.skin}</td>
                    <td className="p-3">
                      {session.notes || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/" className="text-sm text-gray-600 underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}