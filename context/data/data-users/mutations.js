const db = require('../../../handlers/loadDataBase');

async function insertUserQuery(userData) {
  try {
    const columns = Object.keys(userData);
    const placehorders = columns.map(() => '?').join(', ');
    const values = Object.values(userData);

    const query = `INSERT INTO users (${columns.join(
      ', '
    )}) VALUES (${placehorders})`;

    const [result] = await db.query(query, values);

    return result;
  } catch (error) {
    console.error('Erreur lors de la requête 'insertUserQuery' :', error);
    throw error;
  }
}

async function updateUserQuery(userId, userData) {
  try {
    const setClauses = Object.keys(userData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(userData);

    values.push(userId);

    const query = `UPDATE users SET ${setClauses} WHERE id = ?`;
    await db.query(query, values);
  } catch (error) {
    console.error('Erreur lors de la requête 'updateUserQuery' :', error);
    throw error;
  }
}

module.exports = {
  insertUserQuery,
  updateUserQuery,
};
