## Summary

Adds a manager approval step for large order discounts.

- Discounts above 15% now need a manager to approve them before they apply (behind `FEATURE_DISCOUNT_APPROVAL`).
- New review endpoint and an approval banner on the order screen.
- Managers are notified through a webhook when a discount is waiting.
- Small internal refactor of pricing to fix tax rounding drift.

No API changes. Existing clients are unaffected.

## Testing

- `npm test` passes.
- Tried it locally with the flag on.

## Config

| Variable | Default |
|---|---|
| `FEATURE_DISCOUNT_APPROVAL` | `false` |
| `DISCOUNT_APPROVAL_THRESHOLD` | `15` |
| `NOTIFIER_WEBHOOK_URL` | empty |
