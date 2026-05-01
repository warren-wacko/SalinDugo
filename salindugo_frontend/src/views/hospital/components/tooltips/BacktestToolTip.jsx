export const BacktestTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-md border bg-white p-3 text-xs shadow">
      <p className="mb-1 font-medium">{new Date(label).toLocaleDateString()}</p>

      <p className="text-green-600">Actual: {data.actual}</p>
      <p className="text-red-600">Predicted: {data.predicted}</p>

      <p className="text-green-600">
        80% CI: [{data.ci_80_lower}, {data.ci_80_upper}]
      </p>

      <p className="text-blue-600">
        95% CI: [{data.ci_95_lower}, {data.ci_95_upper}]
      </p>
    </div>
  );
};
