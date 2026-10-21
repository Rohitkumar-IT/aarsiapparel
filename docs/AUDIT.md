# Audit — aarsi-apparel-frontend-optimized.zip

Verified on the delivered code: `tsc --noEmit` ✔ · `next lint` ✔ · `next build` ✔ (17 routes). Not click-tested in a real browser or against the live backend (the sandbox cannot reach `admin.aarsiapparel.com`; every API call degrades to its empty fallback).

## Reference site (turtlloom.com)
I could read the **home page** only; `/shop` and product URLs were blocked by the fetch tool, so the product page follows the home-page patterns (product tiles, price/discount display, trust claims) and ecommerce best practice, not a pixel check of TurtlLoom's PDP. The page text exposes only one colour — `theme-color #3A1708` — so `cocoa` now uses it; the rest of the palette stays derived from **your** logo. Their promo codes, return days and customer stats are **not** copied (not your policies); they are env-driven (`NEXT_PUBLIC_PROMO_MESSAGES`, `NEXT_PUBLIC_RETURN_DAYS`).

## Findings and what changed
| # | Area | Problem | Fix |
|---|---|---|---|
| 1 | Security | JSON-LD built with `JSON.stringify` inside `dangerouslySetInnerHTML`: a product/blog text containing `</script>` breaks out of the tag (stored XSS) | `jsonLd()` escapes `<` and U+2028/9 — used in layout + product page |
| 2 | Security / integrity | Cart line prices come from localStorage and the order id is `Math.random` on the client; totals were trusted | Order client sends only `productId/variantId/qty`; server re-prices (`/cart/quote`, `/orders`); `Idempotency-Key`; `expectedTotalPaisa` check |
| 3 | Theme | Hex colours duplicated in `tailwind.config.js`, `globals.css`, header, ShopFilters (`accent-[#8C4F33]`) | One set of RGB-channel CSS variables; Tailwind reads them with `<alpha-value>` so `bg-blush/40` etc. still work |
| 4 | Logo | 240×230 raster monogram: blurry on retina, extra requests, fixed colours, favicon unrelated | Outlined-glyph SVG (no font dependency): `components/Logo.tsx` (inline, ~2 KB, theme tokens, light/dark tone), `public/brand/aarsi-{mark,mark-dark,logo,logo-light}.svg`, `app/icon.svg`, regenerated `icon.png`, `apple-icon.png`, PWA icons, manifest + `theme-color` |
| 5 | Product page | Mobile sticky bar covered content and had no Buy-now; `useMemo(() => p.sizes)` pointless; qty not re-clamped when variant changed; no swipe / keyboard in gallery; arch-shaped image crop cut garments; reviews/details always expanded | `Gallery.tsx` (scroll-snap swipe, thumbnail rail, arrow keys, only first image `priority`), `pb-28` + safe-area bar, qty clamp on add, scroll-to-size on error, accordions, discount badge, trust list driven by store settings |
| 6 | Product SEO | Canonical but no OG url/alt, breadcrumb was text with `/`, not a list; no pre-rendering | OG/Twitter metadata, `<ol>` breadcrumb + `aria-current`, `generateStaticParams` for newest 48 (ISR for the rest), noindex on not-found |
| 7 | Home | Hero was only the logo; no trust row, no occasion shortcuts, categories wrapped into a tall grid | Announcement marquee, collection-image hero (falls back to logo ring), trust strip, New drop, category scroller, Shop by occasion |
| 8 | Cards | Hover image loaded on touch devices; discount only shown ≥10% | Second image hidden below `md`; badge + `% OFF` pill from 5% |
| 9 | Checkout | WhatsApp-only, no payment, no coupon, no stock check | Dual mode: `NEXT_PUBLIC_ORDER_API=true` → quote, coupon, COD/online (Razorpay popup + verify), duplicate-safe submit; `false` → previous WhatsApp flow |
| 10 | Config in archive | `.env.local` was inside the zip. It holds only public values (site URL, API base, phone/email) and is already in `.gitignore` — no secret leaked | Excluded from the new zip; keep real secrets (payment key secret, webhook secret) server-side only, never `NEXT_PUBLIC_*` |

## Still open (needs backend or a decision)
* Order/payment/serviceability endpoints (`docs/API_ORDER_FLOW.md`) must exist before turning on `NEXT_PUBLIC_ORDER_API`.
* Shop sort by price and `sale=true` need backend query support; the UI keeps only sorts the backend already honours.
* Shop facets (colour/fabric/size) are still derived from the current page of results — add a facets endpoint.
* Cart prices shown before checkout can be stale (until the quote). Optional: re-quote on cart open.
* Add rate limiting, bot protection and server-side coupon abuse checks on the order endpoints.
