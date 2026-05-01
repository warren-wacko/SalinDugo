import { AlertCircle, Siren } from "lucide-react";

export default function DemandBudgetCard({
  demandBudget30Days,
  rankedBudget,
  BLOOD_TYPES,
  trendByBloodType,
}) {
  const topValue = rankedBudget[0]?.[1] || 0;

  const totalAll = Object.values(demandBudget30Days).reduce(
    (sum, val) => sum + val,
    0,
  );

  const top3 = rankedBudget.filter(([_, val]) => val > 0).slice(0, 3);
  const criticalTypes = BLOOD_TYPES.filter((bt) => {
    const total = demandBudget30Days[bt] || 0;
    const share = totalAll > 0 ? (total / totalAll) * 100 : 0;
    const trend = trendByBloodType?.[bt]?.trend;

    const isHighPriority = share >= 30;
    const isRising = trend === "Increasing" || trend === "New Demand";

    return total > 0 && isHighPriority && isRising;
  });

  const formatList = (arr) => {
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return arr.join(" and ");
    return arr.slice(0, -1).join(", ") + ", and " + arr.slice(-1);
  };
  return (
    <div>
      {/* Top Summary */}
      <div className="mb-4">
        {criticalTypes.length > 0 && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <Siren className="w-4 h-4 shrink-0" />

              <span>
                High demand expected for{" "}
                <span className="font-semibold">
                  {formatList(criticalTypes)}
                </span>{" "}
                in the next 30 days
              </span>
            </div>
          </div>
        )}
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Top Demand Focus
        </div>

        <div className="flex flex-wrap gap-2">
          {top3.map(([bt, val], i) => {
            const isTop = i === 0;

            return (
              <div
                key={bt}
                className={`
            flex items-center gap-3 px-3 py-2 rounded-full border
            ${
              isTop ? "bg-red-50 border-red-200" : "bg-muted border-transparent"
            }
          `}
              >
                {/* Rank badge */}
                <div
                  className={`
              w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold
              ${
                isTop
                  ? "bg-red-500 text-white"
                  : "bg-foreground/10 text-foreground"
              }
            `}
                >
                  {i + 1}
                </div>

                {/* Blood type */}
                <div className="text-sm font-semibold tracking-tight">{bt}</div>

                {/* Divider */}
                <div className="w-px h-4 bg-border" />

                {/* Value */}
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-sm font-bold text-red-600">
                    {val.toFixed(0)}
                  </span>
                  <span className="text-sm scale-75 text-muted-foreground origin-left">
                    units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BLOOD_TYPES.map((bt) => {
          const trend = trendByBloodType?.[bt]?.trend || "N/A";
          const total = demandBudget30Days[bt] || 0;
          const share = totalAll > 0 ? (total / totalAll) * 100 : 0;
          const daily = total / 30;

          // ✅ PRIORITY (compute FIRST)
          let priority;
          if (total === 0) {
            priority = "No Demand";
          } else if (share >= 30) {
            priority = "High Priority";
          } else if (share >= 15) {
            priority = "Medium";
          } else {
            priority = "Low";
          }

          // ✅ LEVEL (uses priority + trend)
          let level;
          if (total === 0) {
            level = "None";
          } else if (
            (priority === "High Priority" && trend === "Increasing") ||
            trend === "New Demand"
          ) {
            level = "Critical";
          } else if (priority === "High Priority") {
            level = "High";
          } else if (priority === "Medium") {
            level = "Moderate";
          } else {
            level = "Low";
          }

          // 🎨 COLORS
          const levelColor =
            level === "Critical"
              ? "text-red-700"
              : level === "High"
                ? "text-red-500"
                : level === "Moderate"
                  ? "text-orange-500"
                  : level === "Low"
                    ? "text-gray-500"
                    : "text-gray-300";

          const priorityColor =
            priority === "High Priority"
              ? "text-red-600"
              : priority === "Medium"
                ? "text-orange-500"
                : priority === "No Demand"
                  ? "text-gray-300"
                  : "text-gray-400";

          const isHigh = total === topValue && total > 0;

          return (
            <div
              key={bt}
              className={`rounded-md border p-3 flex flex-col gap-1 ${
                isHigh ? "border-red-500 bg-red-50" : ""
              }`}
            >
              {/* 🔥 LEVEL (decision signal) */}
              <div className={`text-xs font-bold ${levelColor}`}>
                {level.toUpperCase()}
              </div>

              {/* Trend */}
              <div className="text-xs text-muted-foreground">{trend}</div>

              {/* Blood type + values */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">{bt}</span>

                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold">
                    {total.toFixed(0)} ({share.toFixed(0)}%)
                  </span>
                  <span className={`text-xs font-semibold ${priorityColor}`}>
                    {priority}
                  </span>
                </div>
              </div>

              {/* Daily requirement */}
              <div className="text-xs text-muted-foreground">
                {total === 0
                  ? "No expected demand"
                  : `${daily.toFixed(1)} units/day`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
