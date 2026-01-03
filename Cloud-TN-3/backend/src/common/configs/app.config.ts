export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 8080),
    baseUrl: process.env.BASE_URL ?? 'http://localhost:8080',
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  },
});
