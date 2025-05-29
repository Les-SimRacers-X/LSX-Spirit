const db = require("../../../loader/loadDataBase")

async function fetchUserAccountConfigByIdQuery(id) {
  try {
    const [rows] = await db.query(
      `SELECT accounts_config AS gameConfig FROM users WHERE id = ?`,
      [id]
    )
    return rows
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchUserAccountConfigByIdQuery' :`,
      error
    )
    throw error
  }
}

async function fetchNumberInAccountConfig(gameIdentifier) {
  try {
    const [rows] = await db.query(
      `
      SELECT JSON_EXTRACT(accounts_config, '$.${gameIdentifier}.number') AS found_number FROM users
      `
    )
    return rows
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchNumberInAccountConfig' :`,
      error
    )
    throw error
  }
}

async function fetchUserProfilByIdQuery(id) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        users.team_id AS teamId,
        users.licence_points AS licencePoints,
        users.wins AS nbWins,
        users.podiums AS nbPodiums,
        users.total_races AS nbRaces,
        teams.role AS teamRoleId,
        (SELECT COUNT(*) FROM sanctions WHERE sanctions.target_id = users.id) AS nbSanctions,
        accounts_config AS gameConfig
      FROM users
      LEFT JOIN teams ON users.team_id = teams.id
      WHERE users.id = ?
      `,
      [id]
    )

    return rows
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchUserProfilByIdQuery' :`,
      error
    )
    throw error
  }
}

module.exports = {
  fetchUserAccountConfigByIdQuery,
  fetchNumberInAccountConfig,
  fetchUserProfilByIdQuery,
}
