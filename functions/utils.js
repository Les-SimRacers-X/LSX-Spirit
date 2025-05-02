const { EmbedBuilder } = require("discord.js")
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api")
const axios = require("axios")
const Config = require("../config")
require("dotenv").config()

function generateID() {
  let characters = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ]
  let firstId = []
  let secondId = []

  for (let i = 0; i < 4; i++)
    firstId.push(characters[Math.floor(Math.random() * characters.length)])
  for (let j = 0; j < 4; j++)
    secondId.push(characters[Math.floor(Math.random() * characters.length)])

  const fullID = `${firstId.join("")}-${secondId.join("")}`

  return fullID
}

function currentTimestamp() {
  const currentTime = Math.floor(Date.now() / 1000)

  return currentTime
}

async function getConsoleUXID(username) {
  try {
    const response = await axios.get(
      `https://xbl.io/api/v2/search/${username}`,
      {
        headers: {
          "X-Authorization": process.env.XBOX_APIKEY,
        },
      }
    )
    if (response.data.people && response.data.people.length > 0) {
      return { platform: "M", id: response.data.people[0].xuid }
    }
  } catch (error) {
    console.log("Erreur lors de la récupération d'un console ID. PSN Sera TEST")
  }

  try {
    const accessCode = await exchangeNpssoForCode(process.env.PSN_APIKEY)
    const accessToken = await exchangeCodeForAccessToken(accessCode)
    const userProfile = await getProfileFromUserName(accessToken, username)

    if (userProfile?.profile?.accountId) {
      return { platform: "P", id: userProfile.profile.accountId }
    }
  } catch (error) {
    console.log("Erreur lors de la récupération de l'ID PSN")
  }

  console.error("Aucun ID n'a été trouver")
  return undefined
}

async function errorHandler(interaction, error) {
  const embedErrorDetectionLog = new EmbedBuilder()
    .setColor(Config.colors.mainServerColor)
    .setTitle("📌 Error Détecté :")
    .setDescription(`\`\`\`${error}\`\`\``)
    .setTimestamp()

  const embedErrorDetected = new EmbedBuilder()
    .setColor(Config.colors.error)
    .setDescription(
      `${Config.emotes.error} **Une erreur a été détecté lors de votre interaction !**`
    )

  console.error(error)
  await bot.channels.cache
    .get(Config.channels.errorLogs)
    .send({ embeds: [embedErrorDetectionLog] })
  return await interaction.reply({
    embeds: [embedErrorDetected],
    components: [],
    ephemeral: true,
  })
}

module.exports = {
  generateID,
  currentTimestamp,
  getConsoleUXID,
  errorHandler,
}
