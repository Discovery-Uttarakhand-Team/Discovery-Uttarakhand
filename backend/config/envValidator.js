/**
 * Phase 9: Environment Configuration Validator
 * Ensures required secrets and config are present in production.
 */

export const validateEnv = () => {
  if (process.env.NODE_ENV !== 'production') {
    return; // We only strictly enforce in production to not break local dev setups unnecessarily
  }

  const missing = [];

  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    missing.push('MONGO_URI (or MONGODB_URI)');
  }
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }
  if (!process.env.FRONTEND_URL) {
    missing.push('FRONTEND_URL');
  }

  if (missing.length > 0) {
    console.error(`[CRITICAL] Missing required production environment variables: ${missing.join(', ')}`);
    console.error('[CRITICAL] Server startup aborted for security reasons.');
    process.exit(1);
  }
};
