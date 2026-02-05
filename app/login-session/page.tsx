"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SessionType = "limit" | "volume" | "strength" | "recovery";

type FormState = {
  sessionDate: string;
  sessionType: SessionType;
  rpe: string; // keep as string for input
  fingerPain: string;
  skin: string;
  gradeLabel: string;
  notes: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const GRADE_OPTIONS = ["yellow", "blue", "purple", "green", "orange", "red", "black", "white"] as const;

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function clampIntString(value: string) {
  // Removes non-digits, keeps empty allowed
  const cleaned = value.replace(/[^\d]/g, "");
  return cleaned;
}

export default function LogSessionPage() {
  const [form, setForm] = useState<FormState>(() => ({
    sessionDate: todayISODate(),
    sessionType: "volume",
    rpe: "6",
    fingerPain: "0",
    skin: "1",
    gradeLabel: "green",
    notes: "",
  }));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });

  const rpeNum = useMemo(() => Number(form.rpe), [form.rpe]);
  const fingerNum = useMemo(() => Number(form.fingerPain), [form.fingerPain]);
  const skinNum = useMemo(() => Number(form.skin), [form.skin]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!form.sessionDate) next.sessionDate = "Please choose a date.";
    if (!form.sessionType) next.sessionType = "Please choose a session type.";

    if (form.rpe.trim() === "") next.rpe = "RPE is required.";
    else if (!Number.isInteger(rpeNum) || rpeNum < 1 || rpeNum > 10) next.rpe = "RPE must be an integer 1–10.";

    if (form.fingerPain.trim() === "") next.fingerPain = "Finger pain is required.";
    else if (!Number.isInteger(fingerNum) || fingerNum < 0 || fingerNum > 3)
      next.fingerPain = "Finger pain must be 0–3.";

    if (form.skin.trim() === "") next.skin = "Skin is required.";
    else if (!Number.isInteger(skinNum) || skinNum < 0 || skinNum > 3) next.skin = "Skin must be 0–3.";

    if (!form.gradeLabel) next.gradeLabel = "Please choose a grade.";
    else if (!GRADE_OPTIONS.includes(form.gradeLabel as any))
      next.gradeLabel = "Grade must be one of your gym colours.";

    // notes optional

    return next;
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the field's error as the user edits
    setErrors((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setStatus({ type: "idle" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });

    const { error } = await supabase.from("sessions").insert([
      {
        session_date: form.sessionDate,
        session_type: form.sessionType,
        rpe: rpeNum,
        finger_pain: fingerNum,
        skin: skinNum,
        grade_label: form.gradeLabel,
        notes: form.notes.trim() ? form.notes.trim() : null,
      },
    ]);

    setSubmitting(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success", message: "Session saved!" });
    // Optional: clear notes, keep defaults
    setForm((prev) => ({ ...prev, notes: "" }));
  };

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Log Session</h1>
          <p className="text-gray-600">
            Record your bouldering session. We’ll use this to guide safe weekly plans later.
          </p>
        </header>

        <form onSubmit={onSubmit} className="rounded-2xl border p-6 shadow-sm space-y-5">
          {/* Date */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Session date</label>
            <input
              type="date"
              value={form.sessionDate}
              onChange={(e) => setField("sessionDate", e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 ${
                errors.sessionDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.sessionDate && <p className="text-sm text-red-600">{errors.sessionDate}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Session type</label>
            <select
              value={form.sessionType}
              onChange={(e) => setField("sessionType", e.target.value as SessionType)}
              className={`w-full rounded-xl border px-3 py-2 ${
                errors.sessionType ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="limit">Limit (hard tries, long rest)</option>
              <option value="volume">Volume/Technique (more climbs, easier)</option>
              <option value="strength">Strength (pull/core/legs)</option>
              <option value="recovery">Recovery (easy + mobility)</option>
            </select>
            {errors.sessionType && <p className="text-sm text-red-600">{errors.sessionType}</p>}
          </div>

          {/* RPE */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">RPE (effort 1–10)</label>
            <input
              inputMode="numeric"
              value={form.rpe}
              onChange={(e) => setField("rpe", clampIntString(e.target.value))}
              placeholder="1–10"
              className={`w-full rounded-xl border px-3 py-2 ${errors.rpe ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.rpe && <p className="text-sm text-red-600">{errors.rpe}</p>}
          </div>

          {/* Finger + Skin */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Finger pain (0–3)</label>
              <input
                inputMode="numeric"
                value={form.fingerPain}
                onChange={(e) => setField("fingerPain", clampIntString(e.target.value))}
                placeholder="0–3"
                className={`w-full rounded-xl border px-3 py-2 ${
                  errors.fingerPain ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fingerPain && <p className="text-sm text-red-600">{errors.fingerPain}</p>}
              <p className="text-xs text-gray-500">0 = none, 3 = significant</p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Skin (0–3)</label>
              <input
                inputMode="numeric"
                value={form.skin}
                onChange={(e) => setField("skin", clampIntString(e.target.value))}
                placeholder="0–3"
                className={`w-full rounded-xl border px-3 py-2 ${errors.skin ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.skin && <p className="text-sm text-red-600">{errors.skin}</p>}
              <p className="text-xs text-gray-500">0 = fine, 3 = torn/flappers</p>
            </div>
          </div>

          {/* Grade */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Grade (gym colour)</label>
            <select
              value={form.gradeLabel}
              onChange={(e) => setField("gradeLabel", e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 ${
                errors.gradeLabel ? "border-red-500" : "border-gray-300"
              }`}
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
            {errors.gradeLabel && <p className="text-sm text-red-600">{errors.gradeLabel}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="e.g., felt strong on overhangs, fingers a bit sore after crimps"
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
              rows={4}
            />
          </div>

          {/* Status */}
          {status.type !== "idle" && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                status.type === "success" ? "border-green-500 text-green-700" : "border-red-500 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save session"}
          </button>

          <p className="text-xs text-gray-500">
            Tip: if finger pain is high, keep it technique-focused and rest properly.
          </p>
        </form>
      </div>
    </main>
  );
}
