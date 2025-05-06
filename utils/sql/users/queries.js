const db = require("../../../loader/loadDataBase")

async function fetchUsersQuery(whereClause = "", values = []) {
  try {
    const [rows] = await db.query(`SELECT * FROM users ${whereClause}`, values)
    return rows
  } catch (error) {
    console.error(`Erreur lors de la requête 'fetchUsers' :`, error)
    throw error
  }
}

async function fetchUserAccountConfigByIdQuery(id) {
  try {
    const [rows] = await db.query(
      `SELECT account_config FROM users WHERE id = ?`,
      [id]
    )
    return [rows]
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchUserAccountConfigByIdQuery' :`,
      error
    )
    throw error
  }
}

async function fetchUserAccountConfigDetailsByIdQuery(gameIdentifier, id) {
  try {
    const [rows] = await db.query(
      `SELECT JSON_EXTRACT(account_config, '$.${gameIdentifier}') AS game_config FROM users WHERE id = ?`,
      [id]
    )
    return [rows]
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchUserAccountConfigDetailsByIdQuery' :`,
      error
    )
    throw error
  }
}

async function fetchNumberInAccountConfig(gameIdentifier, number) {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        'account_config' AS source,
        JSON_EXTRACT(account_config, CONCAT('$.', ${gameIdentifier}, '.${number}')) AS found_number
      FROM users 
      CROSS JOIN JSON_TABLE(
          account_config,
          '$[*]' COLUMNS (
              ${gameIdentifier} VARCHAR(100) PATH '$.name'
          )
      ) AS jt 
      WHERE JSON_EXTRACT(account_config, CONCAT('$.', ${gameIdentifier}, '.${number}')) = ?`,
      [number]
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
        users.team_id AS teamId
        users.licence_points AS licencePoints,
        users.wins AS nbWins,
        users.podiums AS nbPodiums,
        users.total_races AS nbRaces,
        teams.role AS teamRoleId,
        (SELECT COUNT(*) FROM sanctions WHERE sanctions.target_id = users.id) AS nbSanctions
      FROM users
      LEFT JOIN teams ON users.team_id = teams.id
      WHERE users.id = ?
      `,
      [id]
    )

    return [rows]
  } catch (error) {
    console.error(
      `Erreur lors de la requête 'fetchUserProfilByIdQuery' :`,
      error
    )
    throw error
  }
}

async function fetchUserByIdQuery(id) {
  return await fetchUsersQuery("WHERE id = ?", [id])
}

module.exports = {
  fetchUsersQuery,
  fetchUserAccountConfigByIdQuery,
  fetchUserAccountConfigDetailsByIdQuery,
  fetchNumberInAccountConfig,
  fetchUserProfilByIdQuery,
  fetchUserByIdQuery,
}
