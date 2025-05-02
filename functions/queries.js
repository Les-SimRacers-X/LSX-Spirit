const db = require("../loader/loadDataBase")

async function fetchUsersQuery(whereClause = "", values = []) {
  try {
    const [rows] = await db.query(`SELECT * FROM users ${whereClause}`, values)
    return rows
  } catch (error) {
    console.error(`Erreur lors de la requête 'fetchUsers' :`, error)
    throw error
  }
}

async function fetchUserByIdQuery(id) {
  return await fetchUsersQuery("WHERE id = ?", [id])
}

module.exports = {
  fetchUsersQuery,
  fetchUserByIdQuery,
}
