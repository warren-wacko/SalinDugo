function KPICard({ title, value, description, icon: Icon, tone = "neutral" }) {
  const toneStyles = {
    neutral: "border-border bg-card text-foreground",
    red: "border-primary/20 bg-primary/5 text-primary",
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-yellow-200 bg-yellow-50 text-yellow-700",
    slate: "border-border bg-background text-foreground",
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`rounded-md border p-2 ${toneStyles[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value ?? "-"}
        </div>
        {description && (
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default KPICard;
