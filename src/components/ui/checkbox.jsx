import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function Checkbox({ checked = false, onCheckedChange, className, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card hover:border-primary/50",
        className
      )}
      {...props}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </button>
  )
}
