# Market-Ready Checklist (Sean Vegie Store)

This repo already has a solid “MVP storefront” shape: catalog → cart → checkout, with a fast WhatsApp order handoff.

Use this checklist to polish it into a premium, marketable product.

## Current attributes (what’s good)

- Clear purchase funnel: `Shop → Cart → Checkout`
- Simple fulfillment channel: WhatsApp prefilled order message (low operational friction)
- Theme support (light/dark/system) with shared tokens in `src/theme/theme.js`
- Clean state management via Zustand (`src/store/cartStore.js`, `src/store/uiStore.js`)
- Good baseline UI patterns: cards, pills, consistent spacing, friendly typography weight

## 1) Brand + trust (highest ROI)

- Choose a final brand name (consistent across header title, app.json, icons, WhatsApp message header).
- Add a short value prop on Home (e.g. “Same-day delivery in Dar” + hours).
- Add “About / Contact / Support” in Profile (phone, WhatsApp, location, business registration if applicable).
- Add a clear pricing policy: delivery fee rules + minimum order (shown before checkout).

## 2) Premium UI polish

- Create shared UI components (`Card`, `Button`, `Input`, `Pill`) to remove style duplication.
- Add empty/loading states everywhere (catalog loading, image loading, checkout sending, permission denied).
- Improve accessibility:
  - Button hit targets ≥ 44px, readable contrast in light/dark
  - `accessibilityLabel` for key actions (Add, Checkout, Send Order)
- Add subtle feedback: haptics on “Add”/“Checkout”, toast/snackbar for “Added”.
- Add skeletons for product cards while images load (use `expo-image` placeholders).

## 3) Catalog that feels real

- Support units + variants: bunch/kg/gram, size options, “out of stock”.
- Add search + filters (leafy, spices, roots) and sorting (price, popular).
- Add product details screen (photos, unit, origin, freshness notes, delivery estimate).
- Move pricing rules out of hardcoded names; store them on product data (`isGreen`, `unitPrice`, `unitLabel`).

## 4) Checkout that converts

- Prefill customer info (persist name/phone/address locally).
- Validate Tanzanian phone numbers (local +255 formats) and show friendly examples.
- Add delivery fee calculation (distance band / zone) + show final breakdown:
  - subtotal, delivery fee, total
- Offer payment options:
  - Cash on delivery (default)
  - Mobile money (M-Pesa/TigoPesa/Airtel Money) instructions or API integration later
- Add order confirmation screen (after WhatsApp open) with “Track order” + “Reorder”.

## 5) Operations + admin (so the business can run)

- Replace the Admin placeholder with real data:
  - Orders list (status: new/confirmed/out-for-delivery/delivered/canceled)
  - Inventory management (in stock, price edits)
  - Delivery zones + fee rules
- Add a simple local order history for customers (even without backend).
- If/when backend is added: roles (admin vs customer), audit logs, and secure admin access.

## 6) Analytics, reliability, and performance

- Add crash reporting + performance monitoring (Sentry or similar).
- Add basic analytics events (screen views, add-to-cart, checkout started, order sent).
- Optimize images:
  - Resize/compress assets; avoid multi‑MB backgrounds
  - Prefer `expo-image` for caching and better performance
- Guard permissions (location):
  - Explain why location is needed
  - Handle denied/limited permissions gracefully

## 7) Localization and content

- Add Swahili language support (and switcher) if the target market is TZ.
- Make all strings consistent (tone, capitalization, punctuation).
- Use consistent currency formatting (TZS) and consider `sw-TZ` number formatting.

## 8) Release readiness

- Update `app.json` metadata: proper app name, slug, package/bundle ids, icons, splash, store listing name.
- Add a real README:
  - what the app is, screenshots, how to run, how to configure WhatsApp number
- Add a privacy policy draft (especially if using location) and link it in Profile.
- Add EAS build profiles + versioning strategy (semver + build numbers).

## Suggested “premium v1” scope (practical)

- Product details screen + search/filter
- Persist customer + cart locally
- Delivery fee + final total breakdown
- Order history (local) + reorder
- Admin: orders list + status updates
- Crash reporting + basic analytics
