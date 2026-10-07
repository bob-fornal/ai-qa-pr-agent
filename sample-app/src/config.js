const config = {
  port: Number(process.env.PORT || 3000),
  dataFile: process.env.DATA_FILE || ':memory:',
  taxRate: Number(process.env.TAX_RATE || 0.07),
  authSecret: process.env.AUTH_SECRET || 'dev-only-secret',
  discountApprovalThreshold: Number(process.env.DISCOUNT_APPROVAL_THRESHOLD || 15),
  notifierWebhookUrl: process.env.NOTIFIER_WEBHOOK_URL || '',
  features: {
    discountApproval: process.env.FEATURE_DISCOUNT_APPROVAL === 'true',
  },
};

module.exports = { config };
