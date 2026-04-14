import { Input } from "@/components/ui/input";

type Props = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  inputClassName?: string;
};

export function DateRangeInput({
  from,
  to,
  onFromChange,
  onToChange,
  inputClassName = "h-8 w-36 text-xs",
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="date"
        className={inputClassName}
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
      />
      <span className="text-xs text-muted-foreground">〜</span>
      <Input
        type="date"
        className={inputClassName}
        value={to}
        onChange={(e) => onToChange(e.target.value)}
      />
    </div>
  );
}
