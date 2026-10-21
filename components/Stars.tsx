"use client";
import { Star } from "lucide-react";
import { useT } from "./I18nProvider";
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const t = useT();
  return (
    <span className="inline-flex" role="img" aria-label={t("{n} out of 5", { n: value.toFixed(1) })}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? "fill-rose text-rose" : "text-rose/30"} />)}
    </span>
  );
}
