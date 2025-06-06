describe('Bot Configuration', () => {
  test('should have required environment variables', () => {
    expect(process.env.TOKEN).toBeDefined();
  });

  test('should export main functions', () => {
    // Teste tes principales fonctions ici
    expect(typeof require('../index.js')).toBe('object');
  });
});
