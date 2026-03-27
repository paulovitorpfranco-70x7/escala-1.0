// @ts-nocheck
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const stateConfig = {
  loading: {
    icon: Loader2,
    badgeClassName: "bg-primary/10 text-primary",
    iconClassName: "animate-spin",
  },
  empty: {
    icon: Inbox,
    badgeClassName: "bg-muted text-muted-foreground",
    iconClassName: "",
  },
  error: {
    icon: AlertTriangle,
    badgeClassName: "bg-destructive/10 text-destructive",
    iconClassName: "",
  },
};

export default function PageState({
  state = "empty",
  title,
  description,
  icon: IconOverride,
  action,
  className,
  compact = false,
}) {
  const config = stateConfig[state] || stateConfig.empty;
  const Icon = IconOverride || config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm",
        compact ? "px-5 py-8" : "",
        className
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            config.badgeClassName
          )}
        >
          <Icon className={cn("h-6 w-6", config.iconClassName)} />
        </div>
        <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {action ? (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
