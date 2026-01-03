export default () => ({
  redis: {
    url: process.env.REDIS_URL ?? '',
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'teknav',
    restUrl: process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_REST_URL ?? '',
    restToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.REDIS_REST_TOKEN ?? '',
  },
});
