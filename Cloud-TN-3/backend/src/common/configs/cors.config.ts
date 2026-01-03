export default () => ({
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000',
  },
});
