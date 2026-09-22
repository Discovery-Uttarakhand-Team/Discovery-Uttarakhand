/**
 * Phase 9: Environment Configuration Validator
 * Ensures required secrets and config are present in production.
 */

export const validateEnv = () => {
  if (process.env.NODE_ENV !== 'production') {
    return; // We only strictly enforce in production to not break local dev setups unnecessarily
  }

  const requiredVariables = [
    'MONGO_URI',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];

  const missing = [];

  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    console.error(`[CRITICAL] Missing required production environment variables: ${missing.join(', ')}`);
    console.error('[CRITICAL] Server startup aborted for security reasons.');
    process.exit(1);
  }
};
