"use client";

type Item = {
  label: string;
  color: string;
  value: string;
};

type Props = {
  active?: boolean;
  label?: string;
  items: Item[];
};

export function ChartTooltip({ active, label, items }: Props) {
  if (!active || items.every((i) => i.value === "")) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md" style={{ fontSize: 12 }}>
      <p className="font-medium mb-1">{label}</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1 py-0.5">
          <span className="text-muted-foreground">{item.label}：</span>
          <span className="font-mono" style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
