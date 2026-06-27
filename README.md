# Sean Vegie Store (Expo)

A lightweight mobile storefront for ordering vegetables with a cart + WhatsApp checkout flow.

## What’s included

- Product grid (images + pricing) in `src/screens/HomeScreen.js`
- Cart with totals and checkout navigation in `src/screens/CartScreen.js`
- Checkout form that opens WhatsApp with a prefilled order message in `src/screens/CheckoutScreen.js`
- Light/dark/system theme toggle via Zustand in `src/store/uiStore.js`
- Basic “Admin Dashboard” UI placeholder in `src/screens/AdminDashboardScreen.js`

## Quick start

```bash
npm install
npx expo start
```

## Configure WhatsApp ordering

Set your business WhatsApp number (no `+`, no spaces) in `src/utils/whatsapp.js` (`BUSINESS_WHATSAPP`).

## Tech stack

- Expo + React Native
- React Navigation (bottom tabs + stack)
- Zustand for app state

## Project structure

- `src/navigation/RootNavigator.js` — tabs + stacks
- `src/data/vegetables.js` — sample catalog data
- `src/store/cartStore.js` — cart logic + totals
- `src/theme/theme.js` — theme tokens

## Product polish checklist

See `docs/MARKET_READY_CHECKLIST.md` for a practical roadmap to make this app feel premium and market-ready.
