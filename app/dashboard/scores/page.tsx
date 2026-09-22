"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ScoreEntry, TeamDTO } from "@/types";
import ScoreBadge from "@/app/components/ScoreBadge";
import { useSession } from "@/app/components/SessionProvider";

type Preset = "all" | "today" | "week" | "month" | "30d";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
];

// Local-time yyyy-mm-dd (task dates are picked from a local date input, so we
// avoid toISOString(), which would shift the day for users ahead of/behind UTC).
function toLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const today = toLocalISO(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      // Week starts on Monday.
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: toLocalISO(start), to: today };
    }
    case "month":
      return { from: toLocalISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "30d": {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { from: toLocalISO(start), to: today };
    }
    default:
      return { from: "", to: "" };
  }
}

export default function ScoresPage() {
  const session = useSession();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (team: string, from: string, to: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (team) params.set("team", team);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
      const qs = params.toString();
      const res = await fetch(qs ? `/api/scores?${qs}` : "/api/scores");
      const data = await res.json();
      setScores(data.scores ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.role !== "employee") {
      fetch("/api/teams")
        .then((r) => r.json())
        .then((data) => setTeams(data.teams ?? []));
    }
    // Initial load happens in the filter effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(teamFilter, dateFrom, dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, dateFrom, dateTo]);

  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.value);
    return r.from === dateFrom && r.to === dateTo;
  })?.value;

  function applyPreset(preset: Preset) {
    const r = presetRange(preset);
    setDateFrom(r.from);
    setDateTo(r.to);
  }

  const hasDateFilter = !!(dateFrom || dateTo);

  const reportParams = new URLSearchParams();
  if (teamFilter) reportParams.set("team", teamFilter);
  if (dateFrom) reportParams.set("dateFrom", dateFrom);
  if (dateTo) reportParams.set("dateTo", dateTo);
  const reportHref = `/dashboard/scores/report${
    reportParams.toString() ? `?${reportParams}` : ""
  }`;
  const rangeLabel = hasDateFilter
    ? `for tasks scheduled ${dateFrom ? `from ${dateFrom}` : ""}${dateFrom && dateTo ? " " : ""}${dateTo ? `to ${dateTo}` : ""}`
    : "across all time";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl mb-1">
            {session.role === "employee" ? "My score" : "Scores"}
          </h1>
          <p className="text-ink/60">
            Score = tasks completed ÷ tasks assigned, at 1 point per task — {rangeLabel}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={reportHref} className="btn-secondary">
            Generate report
          </Link>
          {teams.length > 0 && (
            <select
              className="input w-56"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              className={`text-sm px-3 py-1.5 rounded-md ${
                activePreset === p.value
                  ? "bg-ink text-white"
                  : "bg-ink/5 text-ink/70 hover:bg-ink/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="date"
            className="input text-sm"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            className="input text-sm"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
          />
          {hasDateFilter && (
            <button
              type="button"
              className="text-sm text-ink/60 hover:text-ink text-left"
              onClick={() => applyPreset("all")}
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-ink/50" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : scores.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-ink/50" colSpan={4}>
                  No task data yet.
                </td>
              </tr>
            ) : (
              scores.map((entry) => (
                <tr key={entry.employee._id} className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-medium">{entry.employee.name}</p>
                    <p className="text-ink/50 text-xs">{entry.employee.department}</p>
                  </td>
                  <td className="px-4 py-3">{entry.totalCompleted}</td>
                  <td className="px-4 py-3">{entry.totalAssigned}</td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={entry.score} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
