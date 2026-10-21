"use client";
import { Heart } from "lucide-react";
import { useShop } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useT } from "./I18nProvider";

export default function WishButton({ product, className = "" }: { product: Product; className?: string }) {
  const t = useT();
  const { isWished, toggleWish } = useShop();
  const on = isWished(product.id);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t("Remove {name} from wishlist", { name: product.name }) : t("Save {name} to wishlist", { name: product.name })}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(product); }}
      className={`grid h-10 w-10 place-items-center rounded-full bg-cream/90 text-cocoa shadow-card backdrop-blur transition hover:bg-white ${className}`}>
      <Heart size={18} className={on ? "fill-rose text-rose" : ""} />
    </button>
  );
}
