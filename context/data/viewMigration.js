const db = require('../../handlers/loadDataBase');

async function newMigration() {
  await db.query(`CREATE VIEW viewOldUsersStructure AS
    SELECT
        u.id AS userID,
        u.username AS discordUsername,
        JSON_UNQUOTE(JSON_EXTRACT(u.accounts_config, '$.acc.name')) AS inGameUsername,
        JSON_UNQUOTE(JSON_EXTRACT(u.accounts_config, '$.acc.trigram')) AS trigramme,
        JSON_UNQUOTE(JSON_EXTRACT(u.EXTRACT(u.accounts_config, '$.acc.number')) AS inGameNumber,
        JSON_UNQUOTE(JSON_EXTRACT(u.accounts_config, '$.acc.id')) AS platformID,
        JSON_UNQUOTE(JSON_EXTRACT(u.accounts_config, '$.acc.platform')) AS platformConsole,
        -- Nouvelles colonnes
        u.licence_points,
        u.wins,
        u.podiums,
        u.total_races
    FROM
        users u;
    `);
}

module.exports = { newMigration };
