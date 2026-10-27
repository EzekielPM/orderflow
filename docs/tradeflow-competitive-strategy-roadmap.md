# TradeFlow Competitive Strategy & Product Roadmap

**Status:** Working strategy document  
**Product:** TradeFlow  
**Positioning:** Every order, handled with confidence.

## 1. Positioning

TradeFlow connects vendors and buyers through a straightforward shopping and order-management experience, from product discovery and checkout to payment confirmation and order tracking.

### Core promise
- Easy to use
- Reliable orders and accurate payment status
- Clear communication between buyers and vendors
- Designed for the realities of Nigerian commerce

### Competitive frame
- **Bumpa:** Compete through a first-class buyer journey connected to vendor operations.
- **Paystack Storefront:** Differentiate through the complete order journey, not only storefront creation and payment collection.
- **WhatsApp Business:** Keep product/storefront sharing familiar while adding structured orders, status visibility and follow-through.
- **Jumia/Konga:** Focus on a direct vendor-to-buyer experience; do not assume we can match their reach or marketplace trust immediately.

These are strategic hypotheses to validate with customer research, not claims that TradeFlow currently outperforms competitors.

## 2. Strategic principle

Serve buyers and vendors together, support different vendor types over time, and prioritise one dependable core commerce journey before expanding into advanced marketplace features.

Use one shared foundation with optional workflows for social sellers, retailers, food/made-to-order vendors and digital-service providers. Avoid building separate products for each segment.

## 3. Prioritised roadmap

### P0 — Dependable orders (first)
- [ ] Test browse, product/service selection, cart, checkout and order confirmation end to end.
- [ ] Verify payments server-side; ensure paid status cannot be set by an unverified client action.
- [ ] Confirm vendor notifications trigger for new orders.
- [ ] Keep buyer tracking and vendor order statuses synchronised.
- [ ] Validate stock, variants, delivery charges and totals before checkout.
- [ ] Handle failed payments, duplicate callbacks and interrupted checkouts safely.

### P1 — Effortless buying and selling
- [ ] Simplify vendor registration and storefront setup.
- [ ] Support products and digital services with suitable fields.
- [ ] Improve mobile buyer and vendor usability.
- [ ] Make storefront/product sharing through WhatsApp straightforward.
- [ ] Explain cancellation, support and dispute pathways.
- [ ] Show vendor details and delivery expectations before purchase.

### P2 — Vendor retention
- [ ] Customer history and repeat-order shortcuts.
- [ ] Sales summaries, best sellers and outstanding orders.
- [ ] Low-stock alerts and basic inventory insights.
- [ ] Reliable customer communications and configurable notifications.
- [ ] Delivery integrations only where user demand justifies the cost.

### P3 — Discovery and growth
- [ ] Cross-vendor search and discovery.
- [ ] Reviews and verified-purchase signals.
- [ ] Promotions, referrals and loyalty features.
- [ ] Advanced marketplace analytics and integrations.

## 4. Success measures

Establish a baseline before setting numerical targets.

- **Order completion rate:** share of initiated orders that reach the intended successful outcome.
- **Payment verification success:** eligible payment attempts resolved correctly, with no false paid statuses.
- **Vendor notification reliability:** new orders that successfully trigger the intended notification.
- **Repeat transactions:** buyers and vendors who return and transact again in a defined period.
- **Order-related complaints:** payment confusion, missed notifications, failed checkout, unclear fulfilment and disputes.

## 5. Implementation rules

1. Audit existing behaviour before coding; classify each item as Working, Incomplete, Missing or Needs verification.
2. Fix the highest-risk journey blockers before adding new features.
3. Preserve existing routes, database contracts and compatibility-sensitive keys unless migration is intentional.
4. Never use test payment credentials for real transactions.
5. Do not claim a feature is complete until its success and failure paths have been tested.
6. Ship in small, verifiable increments and record the relevant commit/deployment.

## 6. First implementation milestone

**Milestone:** P0 audit and reliability fixes.

Audit the current deployed app and repository for:
- buyer checkout and order creation
- Paystack initialisation and server-side verification
- order/payment status transitions
- vendor new-order notification
- buyer order tracking and vendor order management
- stock/variants and delivery-total validation

Deliver an evidence-based gap list before making changes. Then fix and test the highest-risk issue first.

## 7. Vendor needs to validate

| Vendor segment | Needs to investigate |
|---|---|
| Social sellers | Shareable storefront, quick order capture, WhatsApp-friendly communication |
| Retailers | Inventory, variants, order management, sales summaries |
| Food/made-to-order | Customisation, preparation/fulfilment status, timing |
| Digital services | Service descriptions, fulfilment expectations, proof of completion |

## 8. Competitive strategy in one sentence

**TradeFlow should be a reliability-first commerce platform, not a feature-first marketplace.**
