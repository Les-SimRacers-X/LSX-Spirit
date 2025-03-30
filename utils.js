// Function to generate a random ID (for database entries)
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

// Function to generate current timestamp
function currentTimestamp() {
  const currentTime = Math.floor(Date.now() / 1000)

  return currentTime
}

async function getXboxId(axios, gamertag, apikey) {
  try {
    const response = await axios.get(
      `https://xbl.io/api/v2/search/${gamertag}`,
      {
        headers: {
          "X-Authorization": apikey,
        },
      }
    )

    const xboxId = response.data.people[0].xuid
    console.log(`L'ID Xbox pour ${gamertag} est : ${xboxId}`)
    return xboxId
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de l'ID Xbox pour ${gamertag}:`,
      error
    )
  }
}

module.exports = { generateID, currentTimestamp, getXboxId }
