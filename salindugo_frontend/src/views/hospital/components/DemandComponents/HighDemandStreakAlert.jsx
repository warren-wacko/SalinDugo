import React from "react";
import { AlertCircle, Calendar, ArrowRight } from "lucide-react";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function HighDemandStreakAlert({ streaks }) {
  const entries = Object.entries(streaks);

  if (entries.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-[#FFFBEB] shadow-sm overflow-hidden">
      {/* Header - Matching your 'High-Demand Streaks' title bar style */}
      <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3 bg-amber-50/50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
          High-Demand Streaks
        </h3>
      </div>

      {/* List Content */}
      <div className="divide-y divide-amber-100">
        {entries.map(([bt, data]) => {
          const isSevere = data.length >= 7;

          return (
            <div
              key={bt}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/40"
            >
              {/* LEFT: Blood Type & Streak Count */}
              <div className="flex items-center gap-4">
                {/* Blood Type Badge - Matching your dashboard's ID boxes */}
                <div className="flex h-7 w-9 items-center justify-center rounded border border-amber-300 bg-white text-xs font-bold text-amber-900 shadow-sm">
                  {bt}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-sm font-bold ${isSevere ? "text-red-600" : "text-amber-900"}`}
                  >
                    {data.length} Day Streak
                  </span>
                </div>
              </div>

              {/* RIGHT: Date Range - Using your secondary text style */}
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-700/70">
                <Calendar className="h-3 w-3 opacity-60" />
                <span>{formatDate(data.start)}</span>
                <ArrowRight className="h-2.5 w-2.5 opacity-40" />
                <span>{formatDate(data.end)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
