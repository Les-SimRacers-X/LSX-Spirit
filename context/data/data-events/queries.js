const db = require("../../../handlers/loadDataBase")

async function getAllEventsQuery(whereClause = "", values = []) {
  const query = `
            SELECT
                events.id AS id,
                events.track_id AS trackId,
                events.preset_id AS presetId,
                events.description AS description,
                events.timestamp AS timestamp,
                events.message_id AS messageId,
                events.channel_id AS channelId,
                events.users AS registered,
                events.status AS status,
                tracks.name AS trackName,
                tracks.duration AS trackLength,
                tracks.image AS trackImage,
                CONCAT(tracks.flag, '-', tracks.country) AS trackNationality,
                presets.name AS presetName,
                presets.categories AS presetCategory,
                presets.licence AS presetLicence
            FROM events
            LEFT JOIN tracks ON events.track_id = tracks.id
            LEFT JOIN presets ON events.preset_id = presets.id
            ${whereClause}
            `

  const [rows] = await db.query(query, values)
  return rows
}

async function getAllEventsQueryQuery() {
  try {
    return await getAllEventsQuery()
  } catch (error) {
    console.error(
      "Erreur lors de la requête 'getAllEventsQueryQuery' : ",
      error
    )
    throw error
  }
}

async function getEventByIdQuery(id) {
  try {
    return await getAllEventsQuery("WHERE events.id = ?", [id])
  } catch (error) {
    console.error("Erreur lors de la requête 'getEventByIdQuery' : ", error)
    throw error
  }
}

async function getEventByMessageIdQuery(id) {
  try {
    return await getAllEventsQuery("WHERE events.message_id = ?", [id])
  } catch (error) {
    console.error("Erreur lors de la requête 'getEventByIdQuery' : ", error)
    throw error
  }
}

module.exports = {
  getAllEventsQueryQuery,
  getEventByIdQuery,
  getEventByMessageIdQuery,
}
