"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function DashboardPage() {
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

  const stats = useMemo(() => {
    const totalSessions = sessions.length;

    const averageRpe =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, session) => sum + session.rpe, 0) / totalSessions;

    const averageFingerPain =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, session) => sum + session.finger_pain, 0) / totalSessions;

    const averageSkin =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, session) => sum + session.skin, 0) / totalSessions;

    const latestSession = sessions[0];

    let trainingStatus = "Good to train";
    let statusDescription =
      "Your recent logs look manageable. Keep warming up properly and progress slowly.";

    if (averageFingerPain >= 2 || averageSkin >= 2) {
      trainingStatus = "Recovery recommended";
      statusDescription =
        "Your finger pain or skin score is elevated. Consider an easier technique session or rest.";
    } else if (averageRpe >= 8) {
      trainingStatus = "Keep intensity controlled";
      statusDescription =
        "Your average effort is high. Avoid stacking too many hard sessions back-to-back.";
    }

    return {
      totalSessions,
      averageRpe,
      averageFingerPain,
      averageSkin,
      latestSession,
      trainingStatus,
      statusDescription,
    };
  }, [sessions]);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              Quick overview of your bouldering training.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login-session"
              className="rounded-xl bg-black px-4 py-2 text-white text-center"
            >
              Log Session
            </Link>

            <Link
              href="/sessions"
              className="rounded-xl border px-4 py-2 text-center"
            >
              Session History
            </Link>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border p-6 text-gray-600">
            Loading dashboard...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-500 p-6 text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border p-5">
                <p className="text-sm text-gray-500">Total sessions</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.totalSessions}
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-sm text-gray-500">Average RPE</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.averageRpe.toFixed(1)}
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-sm text-gray-500">Avg finger pain</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.averageFingerPain.toFixed(1)}
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-sm text-gray-500">Avg skin score</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.averageSkin.toFixed(1)}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border p-6 space-y-3">
              <h2 className="text-xl font-semibold">Training status</h2>
              <p className="text-2xl font-bold">{stats.trainingStatus}</p>
              <p className="text-gray-600">{stats.statusDescription}</p>
            </section>

            <section className="rounded-2xl border p-6 space-y-3">
              <h2 className="text-xl font-semibold">Latest session</h2>

              {stats.latestSession ? (
                <div className="text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold text-white">Date:</span>{" "}
                    {stats.latestSession.session_date}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Type:</span>{" "}
                    {stats.latestSession.session_type}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Grade:</span>{" "}
                    {stats.latestSession.grade_label}
                  </p>
                  <p>
                    <span className="font-semibold text-white">RPE:</span>{" "}
                    {stats.latestSession.rpe}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No sessions logged yet.</p>
              )}
            </section>

            <Link href="/" className="text-sm text-gray-600 underline">
              ← Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}