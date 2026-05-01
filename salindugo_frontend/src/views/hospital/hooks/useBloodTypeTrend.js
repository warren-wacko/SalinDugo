import { useMemo } from "react";

export function useBloodTypeTrend({
  historyByType,
  bloodTypeForecast,
  BLOOD_TYPES,
}) {
  const last7DayActual = useMemo(() => {
    if (!historyByType.length) return {};

    const grouped = {};

    historyByType.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push(Number(item.blood_requests || 0));
    });

    const result = {};

    Object.keys(grouped).forEach((bt) => {
      const last7 = grouped[bt].slice(-7);
      const avg = last7.reduce((s, v) => s + v, 0) / (last7.length || 1);

      result[bt] = avg;
    });

    return result;
  }, [historyByType]);

  const next7DayForecast = useMemo(() => {
    if (!bloodTypeForecast.length) return {};

    const grouped = {};

    bloodTypeForecast.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push({
        date: item.date,
        value: Number(item.predicted_demand || 0),
      });
    });

    const result = {};

    Object.keys(grouped).forEach((bt) => {
      const first7 = grouped[bt]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 7);

      const avg =
        first7.reduce((s, d) => s + d.value, 0) / (first7.length || 1);

      result[bt] = avg;
    });

    return result;
  }, [bloodTypeForecast]);

  const trendByBloodType = useMemo(() => {
    const result = {};

    BLOOD_TYPES.forEach((bt) => {
      const past = last7DayActual[bt];
      const future = next7DayForecast[bt];

      if (past == null || future == null) {
        result[bt] = {
          trend: "N/A",
          changePct: null,
          past: null,
          future: null,
          delta: null,
        };
        return;
      }

      const delta = future - past;

      let change;
      let changePct;

      if (past === 0 && future === 0) {
        change = 0;
        changePct = 0;
      } else if (past === 0) {
        change = null;
        changePct = null;
      } else {
        change = delta / past;
        changePct = change * 100;
      }

      let trend;

      if (past === 0 && future === 0) trend = "No Demand";
      else if (change == null) trend = "New Demand";
      else if (change > 0.2) trend = "Increasing";
      else if (change > 0.05) trend = "Slight ↑";
      else if (change < -0.2) trend = "Decreasing";
      else if (change < -0.05) trend = "Slight ↓";
      else trend = "Stable";

      result[bt] = {
        trend,
        changePct,
        past,
        future,
        delta,
      };
    });

    return result;
  }, [last7DayActual, next7DayForecast, BLOOD_TYPES]);

  return trendByBloodType;
}
