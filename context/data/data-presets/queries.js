const db = require("../../../handlers/loadDataBase")

async function fetchPresets(whereClause = "", values = []) {
  const [rows] = await db.query(
    `
        SELECT
            presets.id AS id,
            presets.name AS name,
            presets.categories AS categories,
            presets.licence AS licenceObligation
        FROM presets
        ${whereClause}
        `,
    values
  )
  return rows
}

async function fetchPresetsQuery() {
  try {
    return await fetchPresets()
  } catch (error) {
    console.error("Erreur lors de la requête 'fetchPresetsQuery' : ", error)
    throw error
  }
}

module.exports = {
  fetchPresetsQuery,
}
