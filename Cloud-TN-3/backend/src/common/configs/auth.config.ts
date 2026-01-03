export default () => ({
  auth: {
    refreshTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7),
    otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
    bruteForceMaxAttempts: Number(process.env.BRUTE_FORCE_MAX_ATTEMPTS ?? 5),
    bruteForceWindowSec: Number(process.env.BRUTE_FORCE_WINDOW_SEC ?? 300),
  },
});
