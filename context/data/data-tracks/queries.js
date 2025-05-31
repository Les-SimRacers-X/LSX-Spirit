const db = require("../../../handlers/loadDataBase")

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

async function fetchTrackByIdQuery(id) {
  try {
    return await fetchTracks("WHERE tracks.id = ?", [id])
  } catch (error) {
    console.error("Erreur lors de la requête 'fetchTrackByIdQuery' : ", error)
    throw error
  }
}

module.exports = {
  fetchTracksQuery,
  fetchTrackByIdQuery,
}
