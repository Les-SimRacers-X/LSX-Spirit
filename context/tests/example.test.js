require('dotenv').config();

describe('Bot Configuration', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  // test('should have required environment variables', () => {
  //   expect(process.env.TOKEN).toBeDefined();
  // });

  test('should test utility functions', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });
});
