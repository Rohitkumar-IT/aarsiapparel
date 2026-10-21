import Image from "next/image";
import { BLUR_DATA } from "@/lib/media";

/** next/image wrapper with a branded blush placeholder when no image is available. */
export default function Media({ src, alt, sizes, priority, className = "" }: { src?: string | null; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-blush/40 ${className}`} role="img" aria-label={alt}>
        <Image src="/brand/monogram.webp" alt="" width={96} height={96} className="opacity-50" />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} placeholder="blur" blurDataURL={BLUR_DATA} className={`object-cover ${className}`} />;
}
