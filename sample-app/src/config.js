const config = {
  port: Number(process.env.PORT || 3000),
  dataFile: process.env.DATA_FILE || ':memory:',
  taxRate: Number(process.env.TAX_RATE || 0.07),
  authSecret: process.env.AUTH_SECRET || 'dev-only-secret',
};

module.exports = { config };
