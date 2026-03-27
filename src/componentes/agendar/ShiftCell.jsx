import { SHIFT_TYPES } from "../../lib/scheduleUtils";

export default function ShiftCell({ shift, onClick }) {
  const config = SHIFT_TYPES[shift] || SHIFT_TYPES.T;

  if (shift === "T") {
    return (
      <button
        onClick={onClick}
        className="w-8 h-8 rounded-md border border-transparent hover:border-border transition-all duration-150 cursor-pointer"
        title="Trabalho"
      />
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-md border font-bold text-[11px] flex items-center justify-center transition-all duration-150 hover:scale-110 cursor-pointer ${config.color}`}
      title={config.label}
    >
      {config.short}
    </button>
  );
}