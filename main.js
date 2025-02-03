const Discord = require("discord.js")
const intents = new Discord.IntentsBitField(3276799)
const bot = new Discord.Client({ intents })
const loadCommands = require("./loader/loadCommands")
const loadEvents = require("./loader/loadEvents")
const Config = require("./config.json")
require("dotenv").config()

bot.commands = new Discord.Collection()

// Gestion des logs du bot

process.on("unhandledRejection", (err, origin) => {
  console.log(err, origin)

  let embedBotLogs = new Discord.EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp()

  bot.channels.cache
    .get(Config.channels.logsChannel)
    .send({ embeds: [embedBotLogs] })
})

process.on("unhandledRejectionMonitor", (err, origin) => {
  console.log(err, origin)

  let embedBotLogs = new Discord.EmbedBuilder()
    .setColor(Config.mainServerColor)
    .setTitle(`📌 Erreur détecté :`)
    .setDescription(`\`\`\`${err}\n\n\n${origin}\`\`\``)
    .setTimestamp()

  bot.channels.cache
    .get(Config.channels.logsChannel)
    .send({ embeds: [embedBotLogs] })
})

bot.login(process.env.TOKEN)
loadCommands(bot)
loadEvents(bot)
