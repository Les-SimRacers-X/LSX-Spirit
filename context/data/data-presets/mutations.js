const db = require('../../../handlers/loadDataBase');

async function insertPresetQuery(data) {
  try {
    const columns = Object.keys(data);
    const placehorders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO presets (${columns.join(
      ', '
    )}) VALUES (${placehorders})`;

    await db.query(query, values);
  } catch (error) {
    console.error("Erreur lors de la requête 'insertPresetQuery' : ", error);
    throw error;
  }
}

async function deletePresetByIdQuery(id) {
  try {
    await db.query(`DELETE FROM presets WHERE id = ?`, [id]);
  } catch (error) {
    console.error(
      "Erreur lors de la requête 'deletePresetByIdQuery' : ",
      error
    );
    throw error;
  }
}

module.exports = {
  insertPresetQuery,
  deletePresetByIdQuery,
};
