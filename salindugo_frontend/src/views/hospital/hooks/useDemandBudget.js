import { useMemo } from "react";

export function useDemandBudget(bloodTypeForecast, BLOOD_TYPES) {
  const demandBudget30Days = useMemo(() => {
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
      const sorted = grouped[bt].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      const next30 = sorted.slice(0, 30);

      const total = next30.reduce((sum, d) => sum + d.value, 0);

      result[bt] = total;
    });

    return result;
  }, [bloodTypeForecast]);

  // Optional: ranking (very useful)
  const rankedBudget = useMemo(() => {
    return Object.entries(demandBudget30Days).sort((a, b) => b[1] - a[1]);
  }, [demandBudget30Days]);

  return { demandBudget30Days, rankedBudget };
}
