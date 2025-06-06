const {
  IntentsBitField,
  Client,
  Collection,
  EmbedBuilder,
} = require('discord.js');
const intents = new IntentsBitField(3276799);
const bot = new Client({ intents });
const fs = require('fs');
const loadCommands = require('./handlers/loadCommands');
const loadEvents = require('./handlers/loadEvents');
const { Config } = require('./context/config');
require('dotenv').config();

bot.commands = new Collection();

process.on('unhandledRejection', (err, origin) => {
  console.log(err, origin);

  const embedBotLogs = new EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp();

  bot.channels.cache
    .get(Config.channels.errorlogChannel)
    .send({ embeds: [embedBotLogs] });
});

process.on('unhandledRejectionMonitor', (err, origin) => {
  console.log(err, origin);

  const embedBotLogs = new EmbedBuilder()
    .setColor(Config.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp();

  bot.channels.cache
    .get(Config.channels.errorlogChannel)
    .send({ embeds: [embedBotLogs] });
});

fs.watchFile('restart.txt', () => {
  console.log('Restart signal detected, restarting...');
  process.exit(1);
});

global.bot = bot;

bot.login(process.env.TOKEN).then(() => {
  loadCommands(bot);
  loadEvents(bot);
});
