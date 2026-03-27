// @ts-nocheck
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMonthName } from "@/lib/scheduleUtils";

export default function MonthSelector({ month, year, onChange }) {
  function goToPreviousMonth() {
    if (month === 1) {
      onChange(12, year - 1);
      return;
    }

    onChange(month - 1, year);
  }

  function goToNextMonth() {
    if (month === 12) {
      onChange(1, year + 1);
      return;
    }

    onChange(month + 1, year);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        className="h-9 w-9 rounded-full"
        onClick={goToPreviousMonth}
        size="icon"
        variant="outline"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[160px] text-center">
        <h2 className="font-heading text-lg font-bold text-foreground">
          {getMonthName(month, year)}
        </h2>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
      <Button
        className="h-9 w-9 rounded-full"
        onClick={goToNextMonth}
        size="icon"
        variant="outline"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
