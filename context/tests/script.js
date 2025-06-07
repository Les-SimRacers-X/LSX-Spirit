require('dotenv').config();

// Mock Discord.js pour les tests
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue('mocked'),
    on: jest.fn(),
    user: { tag: 'TestBot#1234' },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
  },
}));

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.TOKEN = 'test-token';
