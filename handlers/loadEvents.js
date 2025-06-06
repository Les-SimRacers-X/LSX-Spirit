const fs = require('fs');

module.exports = async (bot) => {
  fs.readdirSync('./events')
    .filter((f) => f.endsWith('.js'))
    .forEach(async (file) => {
      const event = require(`../events/${file}`);
      bot.on(event.name, (...args) => event.execute(bot, ...args));
      console.log(`Event ${file} loaded successfully !`);
    });
};
