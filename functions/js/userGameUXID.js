const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api")
const axios = require("axios")
require("dotenv").config()

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

module.exports = { getConsoleUXID }
