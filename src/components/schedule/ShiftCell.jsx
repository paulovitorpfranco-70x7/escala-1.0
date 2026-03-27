import { SHIFT_TYPES } from "@/lib/scheduleUtils";

export default function ShiftCell({ shift, onClick, disabled = false }) {
  const config = SHIFT_TYPES[shift] || SHIFT_TYPES.T;

  if (shift === "T") {
    return (
      <button
        className={`h-8 w-8 rounded-md border border-transparent transition-all duration-150 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-border"
        }`}
        disabled={disabled}
        onClick={onClick}
        title="Trabalho"
      />
    );
  }

  return (
    <button
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-bold transition-all duration-150 ${config.color} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
      }`}
      disabled={disabled}
      onClick={onClick}
      title={config.label}
    >
      {config.short}
    </button>
  );
}
