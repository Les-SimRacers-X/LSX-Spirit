function getDiscordUserInfos(id) {
  try {
    const user = bot.users.fetch(id)

    if (user) {
      return {
        id: user.id,
        globalName: user.globalName,
        username: user.username,
        avatarURL: user.displayAvatarURL({ dynamic: true, size: 256 }),
        accountCreationTimestamp: user.createdTimestamp,
      }
    } else {
      return null
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des informations Discord de ${id} :`,
      error
    )
    throw error
  }
}

module.exports = {
  getDiscordUserInfos,
}
