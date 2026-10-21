# Aarsi Apparel — API list: product → cart → checkout → order returned

Base URL: `https://admin.aarsiapparel.com` · Browser calls go through the storefront proxy `/api/v1/*` (same-origin, so cookies work).
Envelope on every response: `{ "success": true, "data": … }` or `{ "success": false, "error": { "code": "…", "message": "…" } }`.
**Money is always integer paisa** (₹1,499 = `149900`). **The browser never sends prices** — the server re-prices from `productId + variantId`.

Legend: ✅ exists today (read from `lib/api.ts`) · 🆕 proposed (must be built; the zip's Postman collection has no order endpoints).

---
## A. Catalog (✅ already integrated)

| # | Method & path | Purpose | Notes |
|---|---|---|---|
| 1 | `GET /api/v1/public/store` | delivery note, shipping fee, free-shipping threshold, COD flag | cached 5 min |
| 2 | `GET /api/v1/public/categories` | header / footer / home | |
| 3 | `GET /api/v1/public/collections` | home / filters | |
| 4 | `GET /api/v1/public/products?page&pageSize&sort&search&category&collection&fabric&size&color&minPricePaisa&maxPricePaisa&featured&newArrival&bestSeller&trending` | listing | 🆕 ask backend to add `sort=price_asc\|price_desc` and `sale=true` (the reference site has both) |
| 5 | `GET /api/v1/public/products/:slug` | product page; must return `variants[].id` | variant id is what the cart/order use |

## B. Customer session
| # | Method & path | Auth | Request | Response |
|---|---|---|---|---|
| 6 | ✅ `GET /api/v1/customer/auth/google?returnTo=/checkout` | – | browser redirect | sets HttpOnly cookie |
| 7 | ✅ `GET /api/v1/customer/me` | cookie | – | `{ id, name, email, phone?, avatarUrl? }` (401 = guest) |
| 8 | ✅ `POST /api/v1/customer/auth/logout` | cookie | – | `204` |
| 9 | 🆕 `POST /api/v1/customer/auth/otp/send` *(optional, for phone login)* | – | `{ "phone": "9876543210" }` | `{ "requestId": "otp_8f2", "expiresInSec": 300 }` |
| 10 | 🆕 `POST /api/v1/customer/auth/otp/verify` | – | `{ "phone": "9876543210", "requestId": "otp_8f2", "otp": "482913" }` | `{ customer }` + cookie |

Guest checkout is supported, so 9–10 are optional.

## C. Pre-checkout helpers (🆕)

### 11. `GET /api/v1/public/serviceability?pincode=201306`
```json
{ "success": true, "data": { "pincode": "201306", "serviceable": true, "city": "Greater Noida", "state": "Uttar Pradesh",
  "codAvailable": true, "etaDays": { "min": 3, "max": 6 } } }
```
Used on the product page (delivery estimate) and to auto-fill city/state at checkout.

### 12. `POST /api/v1/public/cart/quote`  — server-authoritative totals
Called by the checkout (debounced) whenever cart, coupon, pincode or payment method changes.
```json
{
  "items": [
    { "productId": "715995eb-b8ea-46df-a733-e5c0dacfdf8b", "variantId": "var_01HZX", "qty": 2 },
    { "productId": "36bbb55d-c3d4-4dfc-a819-c086b861fe35", "variantId": "var_01HZY", "qty": 1 }
  ],
  "couponCode": "WELCOME10",
  "pincode": "201306",
  "paymentMethod": "ONLINE"
}
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "lines": [
      { "productId": "715995eb-…", "variantId": "var_01HZX", "name": "Golden Zari Work Suit Set", "qty": 2, "unitPaisa": 390000, "linePaisa": 780000, "available": true, "maxQty": 4 },
      { "productId": "36bbb55d-…", "variantId": "var_01HZY", "name": "Embroidered Organza Partywear Suit", "qty": 1, "unitPaisa": 210000, "linePaisa": 210000, "available": true, "maxQty": 9 }
    ],
    "subtotalPaisa": 990000,
    "discountPaisa": 99000,
    "shippingPaisa": 0,
    "codFeePaisa": 0,
    "gstPaisa": 47143,
    "totalPaisa": 891000,
    "coupon": { "code": "WELCOME10", "applied": true, "message": "10% off applied" },
    "serviceable": true,
    "etaDays": { "min": 3, "max": 6 },
    "warnings": []
  }
}
```
`gstPaisa` is the GST **included** in `totalPaisa` (display only). Unavailable lines come back with `"available": false`.

### 13. `POST /api/v1/public/coupons/validate` *(optional; quote already covers it)*
`{ "code": "WELCOME10", "subtotalPaisa": 990000, "paymentMethod": "ONLINE" }` → `{ "valid": true, "discountPaisa": 99000, "message": "…" }`

### 14. `GET|POST /api/v1/customer/addresses` *(logged-in users, optional)*
POST body = the `shippingAddress` object below plus `{ "label": "Home", "isDefault": true }`.

## D. Create the order (🆕) — the core call

### 15. `POST /api/v1/public/orders`
Headers: `Content-Type: application/json`, **`Idempotency-Key: <uuid>`** (same key on retry → server returns the *original* order, never a duplicate). Cookie optional (if present the order is linked to the customer).

```json
{
  "items": [
    { "productId": "715995eb-b8ea-46df-a733-e5c0dacfdf8b", "variantId": "var_01HZX", "qty": 2 },
    { "productId": "36bbb55d-c3d4-4dfc-a819-c086b861fe35", "variantId": "var_01HZY", "qty": 1 }
  ],
  "paymentMethod": "ONLINE",
  "couponCode": "WELCOME10",
  "customer": { "name": "Riya Sharma", "phone": "9876543210", "email": "riya@example.com" },
  "shippingAddress": {
    "name": "Riya Sharma", "phone": "9876543210",
    "line1": "B-25, Sector 1", "line2": "Near Metro Station", "landmark": "Opp. City Mall",
    "city": "Noida", "state": "Uttar Pradesh", "pincode": "201301", "country": "IN"
  },
  "billingSameAsShipping": true,
  "notes": "Please call before delivery",
  "expectedTotalPaisa": 891000,
  "source": "web"
}
```
Server must: re-price lines, check stock **and reserve it**, validate coupon + serviceability + COD eligibility, compare with `expectedTotalPaisa`, create the order, and (for ONLINE) create the gateway order.

**Response `201`** — the order is returned here:
```json
{
  "success": true,
  "data": {
    "id": "ord_01J9Q3K7",
    "orderNumber": "AA-240913-0042",
    "status": "PENDING_PAYMENT",
    "paymentStatus": "PENDING",
    "paymentMethod": "ONLINE",
    "placedAt": "2026-10-20T09:41:12.000Z",
    "lines": [ { "productId": "715995eb-…", "variantId": "var_01HZX", "name": "Golden Zari Work Suit Set", "qty": 2, "unitPaisa": 390000, "linePaisa": 780000, "available": true } ],
    "subtotalPaisa": 990000, "discountPaisa": 99000, "shippingPaisa": 0, "codFeePaisa": 0, "gstPaisa": 47143, "totalPaisa": 891000,
    "shippingAddress": { "name": "Riya Sharma", "phone": "9876543210", "line1": "B-25, Sector 1", "city": "Noida", "state": "Uttar Pradesh", "pincode": "201301", "country": "IN" },
    "payment": { "gateway": "razorpay", "keyId": "rzp_live_xxxxx", "gatewayOrderId": "order_Nx81Pq", "amountPaisa": 891000, "currency": "INR" },
    "accessToken": "eyJhbGciOi…"
  }
}
```
For `paymentMethod: "COD"` the response has `"status": "CONFIRMED"` (or `"PENDING_CONFIRMATION"`), `"paymentStatus": "COD_PENDING"` and **no** `payment` block.

Errors:
| HTTP | code | meaning / UI behaviour |
|---|---|---|
| 409 | `PRICE_CHANGED` | totals moved → UI re-quotes and asks the customer to review |
| 409 | `OUT_OF_STOCK` | `details: [{ variantId, available }]` → UI marks the line |
| 422 | `VALIDATION_FAILED` | `details: { "shippingAddress.pincode": "Invalid pincode" }` |
| 422 | `PINCODE_NOT_SERVICEABLE`, `COD_NOT_AVAILABLE`, `COUPON_INVALID` | |
| 429 | `RATE_LIMITED` | |

## E. Payment (🆕, ONLINE only — Razorpay shown; swap for your gateway)
The storefront opens the gateway popup with the `payment` block from #15.

### 16. `POST /api/v1/public/orders/:id/payment/verify`
```json
{ "gatewayOrderId": "order_Nx81Pq", "paymentId": "pay_Nx8AbC", "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d" }
```
Server verifies `HMAC_SHA256(gatewayOrderId + "|" + paymentId, secret) == signature`, marks the order paid, **returns the updated order**:
`{ "id": "ord_01J9Q3K7", "orderNumber": "AA-240913-0042", "status": "CONFIRMED", "paymentStatus": "PAID", … , "accessToken": "…" }`

### 17. `POST /api/v1/webhooks/razorpay`  *(server → server, no browser)*
Source of truth when the customer closes the tab after paying. Verify `X-Razorpay-Signature`; handle `payment.captured` (→ `PAID`, `CONFIRMED`) and `payment.failed` (→ `FAILED`, release reserved stock). Must be idempotent. A cron cancels `PENDING_PAYMENT` orders after ~30 min and releases stock.

### 18. `POST /api/v1/public/orders/:id/payment/retry`
Returns a fresh `payment` block for an order still in `PENDING_PAYMENT`.

## F. Order returned / post-order (🆕)

### 19. `GET /api/v1/public/orders/:orderNumber?token=<accessToken>`  — confirmation page
Returns the same `Order` object as #15 (+ `tracking`). `token` lets guests re-open the page; logged-in users may omit it (cookie).
```json
{ "success": true, "data": { "orderNumber": "AA-240913-0042", "status": "SHIPPED", "paymentStatus": "PAID",
  "tracking": { "courier": "Delhivery", "awb": "1234567890", "url": "https://track.example/1234567890" }, "…": "…" } }
```

### 20. `POST /api/v1/public/orders/track`  — "Track order" page
`{ "orderNumber": "AA-240913-0042", "phone": "9876543210" }` → order summary + `timeline: [{ status, at }]`.

### 21. `GET /api/v1/customer/orders?page=1&pageSize=10` · `GET /api/v1/customer/orders/:id`  — account page
### 22. `POST /api/v1/customer/orders/:id/cancel` — `{ "reason": "Ordered by mistake" }` (only before `SHIPPED`)
### 23. `POST /api/v1/customer/orders/:id/return` — `{ "items": [{ "variantId": "var_01HZX", "qty": 1 }], "reason": "SIZE_ISSUE", "comment": "Too tight" }`

## Order state machine
`PENDING_PAYMENT → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`
COD: `PENDING_CONFIRMATION → CONFIRMED → …` · Side exits: `FAILED`, `CANCELLED`, `RETURN_REQUESTED → RETURNED → REFUNDED`.
`paymentStatus`: `PENDING · PAID · FAILED · COD_PENDING · COD_COLLECTED · REFUNDED`.

## Sequence the storefront follows
```
product page   GET #5 ─────────────► choose size/colour → variantId
cart (browser) localStorage {productId, variantId, qty}  (no trusted prices)
checkout       POST #12 quote (debounced) ─► totals, coupon, serviceable
place order    POST #15 (Idempotency-Key) ─► 201 order  ───────────── COD ──► /order-confirmation/AA-…?t=…
                                          └► ONLINE: gateway popup ─► POST #16 verify ─► order(PAID) ─► confirmation
confirmation   GET #19 ─► order returned (lines, totals, address, tracking)
background     webhook #17 reconciles payment even if the tab was closed
```
