# OrderFlow

OrderFlow is a mobile-first order-management MVP for social sellers and their buyers.

## Current MVP flow

- Merchant registration, sign-in and business setup
- Merchant dashboard and order creation
- Order review and secure-link sharing
- Buyer confirmation and delivery details
- Test payment selection and payment-success screen
- Buyer order tracking
- Merchant buyer list and order-status updates

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Import this repository into Vercel and keep the default Next.js settings. The current MVP requires no environment variables.

## Free MVP architecture

- Next.js and React
- Vercel Hobby hosting
- Browser local storage for this first validation build
- Supabase Free and Paystack test mode planned for the next integration phase

Payment actions in this version are demonstrations only; no real money is collected.
