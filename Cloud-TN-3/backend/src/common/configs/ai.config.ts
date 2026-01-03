export default () => ({
  ai: {
    apiKey: process.env.OPENROUTER_API_KEY,
    apiUrl: process.env.OPENROUTER_API_URL ?? 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-r1-0528:free',
  },
});
