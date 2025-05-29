const db = require("../../../loader/loadDataBase")

async function insertEventQuery(data) {
  try {
    const columns = Object.keys(data)
    const placehorders = columns.map(() => "?").join(", ")
    const values = Object.values(data)

    const query = `INSERT INTO events (${columns.join(
      ", "
    )}) VALUES (${placehorders})`

    await db.query(query, values)
  } catch (error) {
    console.error("Erreur lors de la requête 'insertEventQuery' : ", error)
    throw error
  }
}

async function updateEventQuery(id, data) {
  try {
    const setClauses = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ")
    const values = Object.values(data)

    values.push(id)

    const query = `UPDATE events SET ${setClauses} WHERE id = ?`
    await db.query(query, values)
  } catch (error) {
    console.error("Erreur lors de la requête 'updateEventQuery' : ", error)
    throw error
  }
}

async function deleteEventByIdQuery(id) {
  try {
    await db.query(`DELETE FROM events WHERE id = ?`, [id])
  } catch (error) {
    console.error("Erreur lors de la requête 'updateEventQuery' : ", error)
    throw error
  }
}

module.exports = {
  insertEventQuery,
  updateEventQuery,
  deleteEventByIdQuery,
}
