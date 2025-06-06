const db = require('../../../handlers/loadDataBase');

async function insertTrackQuery(data) {
  try {
    const columns = Object.keys(data);
    const placehorders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO tracks (${columns.join(
      ', '
    )}) VALUES (${placehorders})`;

    await db.query(query, values);
  } catch (error) {
    console.error("Erreur lors de la requête 'insertTrackQuery' : ", error);
    throw error;
  }
}

async function deleteTrackByIdQuery(id) {
  try {
    await db.query(`DELETE FROM tracks WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Erreur lors de la requête 'deleteTrackByIdQuery' : ", error);
    throw error;
  }
}

module.exports = {
  insertTrackQuery,
  deleteTrackByIdQuery,
};
