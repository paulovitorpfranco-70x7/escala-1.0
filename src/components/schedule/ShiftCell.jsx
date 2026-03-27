import { SHIFT_TYPES } from "@/lib/scheduleUtils";

export default function ShiftCell({ shift, onClick }) {
  const config = SHIFT_TYPES[shift] || SHIFT_TYPES.T;

  if (shift === "T") {
    return (
      <button
        className="h-8 w-8 cursor-pointer rounded-md border border-transparent transition-all duration-150 hover:border-border"
        onClick={onClick}
        title="Trabalho"
      />
    );
  }

  return (
    <button
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border text-[11px] font-bold transition-all duration-150 hover:scale-110 ${config.color}`}
      onClick={onClick}
      title={config.label}
    >
      {config.short}
    </button>
  );
}
