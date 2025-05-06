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

async function fetchUserByIdQuery(id) {
  return await fetchUsersQuery("WHERE id = ?", [id])
}

module.exports = {
  fetchUsersQuery,
  fetchUserAccountConfigByIdQuery,
  fetchUserAccountConfigDetailsByIdQuery,
  fetchNumberInAccountConfig,
  fetchUserByIdQuery,
}
