const intents = new IntentsBitField(3276799)
const bot = new Client({ intents })
const fs = require("fs")
const loadCommands = require("./loader/loadCommands")
const loadEvents = require("./loader/loadEvents")
const { Config } = require("./utils/config")
const { IntentsBitField, Client, Collection, EmbedBuilder } = require("discord.js")
require("dotenv").config()

bot.commands = new Collection()

process.on("unhandledRejection", (err, origin) => {
  console.log(err, origin)

  let embedBotLogs = new EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp()

  bot.channels.cache
    .get(Config.channels.errorlogChannel)
    .send({ embeds: [embedBotLogs] })
})

process.on("unhandledRejectionMonitor", (err, origin) => {
  console.log(err, origin)

  let embedBotLogs = new EmbedBuilder()
    .setColor(Config.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp()

  bot.channels.cache
    .get(Config.channels.errorlogChannel)
    .send({ embeds: [embedBotLogs] })
})

fs.watchFile("restart.txt", () => {
  console.log("Restart signal detected, restarting...")
  process.exit(1)
})

bot.login(process.env.TOKEN).then(() => {
  global.bot = bot
})
loadCommands(bot)
loadEvents(bot)
