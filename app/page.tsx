import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">BoulderBase 🧗‍♀️</h1>
          <p className="text-lg text-gray-600">
            Beginner-friendly bouldering training and recovery planner.
          </p>
          <p className="text-sm text-gray-500">
            Supports colour-based grading (yellow → white). Current level:{" "}
            <span className="font-semibold">Green</span>.
          </p>
        </header>

        <section className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick actions</h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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

            <button
              className="rounded-xl border px-4 py-2 opacity-50 cursor-not-allowed"
              disabled
            >
              Generate Weekly Plan (soon)
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Next up: session history + beginner-safe rules engine.
          </p>
        </section>
      </div>
    </main>
  );
}
