import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMonthName } from "../../lib/scheduleUtils";

export default function MonthSelector({ month, year, onChange }) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };
  const next = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={prev} className="h-9 w-9 rounded-full">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <div className="text-center min-w-[160px]">
        <h2 className="font-heading text-lg font-bold text-foreground">{getMonthName(month)}</h2>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
      <Button variant="outline" size="icon" onClick={next} className="h-9 w-9 rounded-full">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}