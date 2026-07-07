"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function daysSince(dateString: string) {
  const today = new Date();
  const date = new Date(dateString);
  const diff = today.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getRecoveryColor(value: number) {
  if (value >= 2) return "bg-red-500";
  if (value >= 1) return "bg-yellow-400";
  return "bg-green-400";
}

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
    const latestSession = sessions[0];

    const averageRpe =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, s) => sum + s.rpe, 0) / totalSessions;

    const averageFingerPain =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, s) => sum + s.finger_pain, 0) / totalSessions;

    const averageSkin =
      totalSessions === 0
        ? 0
        : sessions.reduce((sum, s) => sum + s.skin, 0) / totalSessions;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const sessionsThisWeek = sessions.filter(
      (s) => new Date(s.session_date) >= oneWeekAgo
    );

    const lastSessionDays = latestSession
      ? daysSince(latestSession.session_date)
      : null;

    const currentGrade = latestSession?.grade_label ?? "Not set";

    let status = "Ready to Train";
    let statusIcon = "🟢";
    let recommendation = "Volume session";
    let advice = ["60–90 minutes", "Technique focus", "Avoid rushing harder grades"];

    if (averageFingerPain >= 2 || averageSkin >= 2) {
      status = "Recovery Day";
      statusIcon = "🔴";
      recommendation = "Rest or very light technique";
      advice = ["Avoid crimps", "No limit bouldering", "Prioritise recovery"];
    } else if (averageRpe >= 8) {
      status = "Control Intensity";
      statusIcon = "🟡";
      recommendation = "Moderate session";
      advice = ["Keep RPE under 7", "Focus on movement", "Avoid max attempts"];
    }

    return {
      totalSessions,
      averageRpe,
      averageFingerPain,
      averageSkin,
      sessionsThisWeek: sessionsThisWeek.length,
      latestSession,
      lastSessionDays,
      currentGrade,
      status,
      statusIcon,
      recommendation,
      advice,
    };
  }, [sessions]);

  const chartData = useMemo(() => {
    return [...sessions]
      .sort(
        (a, b) =>
          new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
      )
      .map((session) => ({
        date: formatShortDate(session.session_date),
        rpe: session.rpe,
        fingerPain: session.finger_pain,
        skin: session.skin,
      }));
  }, [sessions]);

  return (
    <main className="min-h-screen p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">BoulderBase</p>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Training overview, recovery signals, and climbing guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/login-session" className="rounded-xl bg-white px-4 py-2 text-black">
              Log Session
            </Link>
            <Link href="/sessions" className="rounded-xl border px-4 py-2">
              Session History
            </Link>
            <Link href="/" className="rounded-xl border px-4 py-2">
              Home
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
            <section className="rounded-3xl border p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                <div>
                  <p className="text-sm text-gray-500">Training status</p>
                  <h2 className="mt-2 text-4xl font-bold">
                    {stats.statusIcon} {stats.status}
                  </h2>

                  <div className="mt-6 rounded-2xl border p-5">
                    <p className="text-sm text-gray-500">
                      Today&apos;s recommendation
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {stats.recommendation}
                    </p>

                    <ul className="mt-4 space-y-2 text-gray-600">
                      {stats.advice.map((item) => (
                        <li key={item}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-gray-500">Current grade</p>
                  <p className="mt-2 text-4xl font-bold capitalize">
                    {stats.currentGrade}
                  </p>

                  <div className="mt-6">
                    <p className="text-sm text-gray-500">Last session</p>
                    <p className="mt-1 text-2xl font-bold">
                      {stats.lastSessionDays ?? "—"} days ago
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border p-5">
                <p className="text-2xl">📚</p>
                <p className="mt-3 text-sm text-gray-500">Total sessions</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalSessions}</p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-2xl">🔥</p>
                <p className="mt-3 text-sm text-gray-500">Sessions this week</p>
                <p className="mt-2 text-3xl font-bold">{stats.sessionsThisWeek}</p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-2xl">💪</p>
                <p className="mt-3 text-sm text-gray-500">Average RPE</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.averageRpe.toFixed(1)}
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-2xl">⏱</p>
                <p className="mt-3 text-sm text-gray-500">Days since last session</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.lastSessionDays ?? "—"}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border p-6">
                <h2 className="text-xl font-semibold">Recovery signals</h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Finger pain</span>
                      <span>{stats.averageFingerPain.toFixed(1)} / 3</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-gray-800">
                      <div
                        className={`h-3 rounded-full ${getRecoveryColor(stats.averageFingerPain)}`}
                        style={{
                          width: `${Math.min(100, (stats.averageFingerPain / 3) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Skin condition</span>
                      <span>{stats.averageSkin.toFixed(1)} / 3</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-gray-800">
                      <div
                        className={`h-3 rounded-full ${getRecoveryColor(stats.averageSkin)}`}
                        style={{
                          width: `${Math.min(100, (stats.averageSkin / 3) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-6">
                <h2 className="text-xl font-semibold">Latest session</h2>

                {stats.latestSession ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-2xl font-bold">
                      {formatDate(stats.latestSession.session_date)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border px-3 py-1 text-sm capitalize">
                        🏷 {stats.latestSession.session_type}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-sm capitalize">
                        🟢 {stats.latestSession.grade_label}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-sm">
                        💪 RPE {stats.latestSession.rpe}
                      </span>
                    </div>

                    {stats.latestSession.notes && (
                      <p className="mt-4 text-gray-600">
                        📝 {stats.latestSession.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-gray-600">No sessions logged yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">🏆 Personal best</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Highest logged grade</p>
                  <p className="mt-1 text-2xl font-bold capitalize">
                    {stats.currentGrade}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sessions logged</p>
                  <p className="mt-1 text-2xl font-bold">{stats.totalSessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average effort</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.averageRpe.toFixed(1)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-6">
              <div>
                <h2 className="text-xl font-semibold">📈 Progress trends</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Track effort, finger pain, and skin condition over your logged sessions.
                </p>
              </div>

              {chartData.length < 2 ? (
                <div className="mt-6 rounded-2xl border p-6 text-gray-600">
                  Log at least two sessions to see progress trends.
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">RPE over time</h3>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="date" stroke="#6b7280" />
                          <YAxis domain={[0, 10]} stroke="#6b7280" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="rpe"
                            stroke="#ffffff"
                            strokeWidth={2}
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">Finger pain over time</h3>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="date" stroke="#6b7280" />
                          <YAxis domain={[0, 3]} stroke="#6b7280" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="fingerPain"
                            stroke="#ffffff"
                            strokeWidth={2}
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">Skin condition over time</h3>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="date" stroke="#6b7280" />
                          <YAxis domain={[0, 3]} stroke="#6b7280" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="skin"
                            stroke="#ffffff"
                            strokeWidth={2}
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}