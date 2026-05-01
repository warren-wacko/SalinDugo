import { useMemo } from "react";

export function useHighDemandStreak({ bloodTypeForecast, historyByType }) {
  const baselineByType = useMemo(() => {
    if (!historyByType.length) return {};

    const grouped = {};

    historyByType.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push({
        date: item.date,
        value: Number(item.blood_requests || 0),
      });
    });

    const result = {};

    Object.keys(grouped).forEach((bt) => {
      const last14 = grouped[bt]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14);

      const avg =
        last14.reduce((s, d) => s + d.value, 0) / (last14.length || 1);

      result[bt] = avg;
    });

    return result;
  }, [historyByType]);

  const forecastByType = useMemo(() => {
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

    return grouped;
  }, [bloodTypeForecast]);

  const streaks = useMemo(() => {
    const result = {};

    Object.keys(forecastByType).forEach((bt) => {
      const baseline = baselineByType[bt] || 0;

      const series = forecastByType[bt]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 30);

      let current = 0;
      let max = 0;
      let startIdx = null;
      let bestRange = null;

      series.forEach((day, i) => {
        if (day.value > baseline) {
          current++;

          if (current === 1) startIdx = i;

          if (current > max) {
            max = current;
            bestRange = [startIdx, i];
          }
        } else {
          current = 0;
        }
      });

      if (max >= 3 && bestRange) {
        result[bt] = {
          length: max,
          start: series[bestRange[0]].date,
          end: series[bestRange[1]].date,
        };
      }
    });

    return result;
  }, [forecastByType, baselineByType]);

  return streaks;
}
