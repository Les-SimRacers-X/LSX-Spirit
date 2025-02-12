module.exports = async (bot, member) => {
  let db = bot.db

  try {
    const [users] = await db
      .promise()
      .query(`SELECT * FROM users WHERE userID = ?`, [member.id])

    if (users.length > 0) {
      // L'utilisateur est dans la base de données alors on le supprime
      await db
        .promise()
        .query(`DELETE FROM users WHERE userID = ?`, [member.id])

      console.log(
        `l'utilisateur ${member.username} (${member.id}) a été supprimer de la base de données.`
      )
    } else {
      console.log(
        `l'utilisateur ${member.username} (${member.id}) n'était pas dans la base de données.`
      )
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur : ", error)
  }
}
