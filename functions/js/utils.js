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

module.exports = { generateID, currentTimestamp }
