const db = require("../../../loader/loadDataBase")

async function fetchTracks(whereClause = "", values = []) {
  const [rows] = await db.query(
    `
        SELECT
            tracks.id AS id,
            CONCAT(tracks.flag, '-', tracks.country) AS nationality,
            tracks.name AS name,
            tracks.duration AS duration,
            tracks.image AS image
        FROM tracks
        ${whereClause}
        `,
    values
  )
  return rows
}

async function fetchTracksQuery() {
  try {
    return await fetchTracks()
  } catch (error) {
    console.error("Erreur lors de la requête 'fetchTracksQuery' : ", error)
    throw error
  }
}

module.exports = {
  fetchTracksQuery,
}
