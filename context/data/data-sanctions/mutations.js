const db = require('../../../handlers/loadDataBase');

async function insertSanctionQuery(data) {
  try {
    const columns = Object.keys(data);
    const placehorders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO sanctions (${columns.join(
      ', '
    )}) VALUES (${placehorders})`;

    await db.query(query, values);
  } catch (error) {
    console.error("Erreur lors de la requête 'insertSanctionQuery' : ", error);
    throw error;
  }
}

async function deleteSanctionByIdQuery(id) {
  try {
    await db.query(`DELETE FROM sanctions WHERE id = ?`, [id]);
  } catch (error) {
    console.error(
      "Erreur lors de la requête 'deleteSanctionByIdQuery' : ",
      error
    );
    throw error;
  }
}

module.exports = {
  insertSanctionQuery,
  deleteSanctionByIdQuery,
};
