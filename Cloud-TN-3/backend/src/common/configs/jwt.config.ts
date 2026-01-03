export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change_this_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
});
