export default function BloodTypeTrendCard({ trendByBloodType, BLOOD_TYPES }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BLOOD_TYPES.map((bt) => {
        const data = trendByBloodType[bt];
        const trend = data?.trend;
        const change = data?.changePct;
        const past = data?.past;
        const future = data?.future;
        const delta = data?.delta;

        const color =
          trend === "Increasing"
            ? "text-red-600"
            : trend === "Decreasing"
              ? "text-blue-600"
              : trend === "New Demand"
                ? "text-purple-600"
                : trend === "No Demand"
                  ? "text-gray-400"
                  : trend.includes("↑")
                    ? "text-orange-500"
                    : trend.includes("↓")
                      ? "text-cyan-500"
                      : "text-muted-foreground";

        return (
          <div key={bt} className="rounded-md border p-3 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{bt}</span>
              <span className={`text-xs font-bold ${color}`}>
                {trend}
                {trend !== "No Demand" &&
                  change != null &&
                  ` (${delta.toFixed(1)} | ${change.toFixed(0)}%)`}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              {past?.toFixed(1)} → {future?.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
