const db = require('../../handlers/loadDataBase');

async function databaseMigration() {
  try {
    console.log('Début de la migration des données...');
    // --- Étape 1 : Ajoute de la colonne accounts_config
    await db.query(
      `ALTER TABLE users ADD COLUMN accounts_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT '{}'`
    );
    console.log("Colonne 'accounts_config' ajoutée.");

    // --- Étape 2 : Migrer les données vers accounts_config
    const [rows] = await db.query(
      `SELECT userID, inGameUsername, trigramme, inGameNumber, platformID, platformConsole FROM users`
    );
    for (const row of rows) {
      const accountConfig = {
        acc: {
          id: row.platformID,
          name: row.inGameUsername,
          trigram: row.trigramme,
          platform: row.platformConsole,
          number: Number(row.inGameNumber),
        },
      };

      await db.query(`UPDATE users SET accounts_config = ? WHERE userID = ?`, [
        JSON.stringify(accountConfig),
        row.userID,
      ]);
    }
    console.log("Migration des données vers 'accounts_config' terminée.");

    // --- Étape 3 : Suppression des anciennes colonnes
    await db.query(`
          ALTER TABLE users
          DROP COLUMN inGameUsername,
          DROP COLUMN trigramme,
          DROP COLUMN inGameNumber,
          DROP COLUMN platformID,
          DROP COLUMN embedColor,
          DROP COLUMN platformConsole;
          `);
    console.log('Anciennes colonnes supprimées.');

    // --- Étape 4 : Renommer les colonnes restantes
    await db.query(`
          ALTER TABLE users
          CHANGE COLUMN userID id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          CHANGE COLUMN discordUsername username TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN teamID team_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN licencePoints licence_points INT(11) NOT NULL DEFAULT 0,
          CHANGE COLUMN totalRaces total_races INT(11) NOT NULL DEFAULT 0,
          CHANGE COLUMN lastSanctionID sanction_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL;
        `);
    console.log("Colonnes de la table 'users' renommer avec succès");

    // --- Étape 5 : Modification des colonnes de la table events
    await db.query(`
          ALTER TABLE events
          CHANGE COLUMN eventID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          CHANGE COLUMN eventTrackID track_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN eventPresetID preset_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN eventDescription description LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN eventParticipation users LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '[]', -- Renomme et potentiellement change le type/encodage
          CHANGE COLUMN eventTimestamp timestamp TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN eventMessageID message_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Adaptez le type si nécessaire (varchar vs text)
          CHANGE COLUMN eventChannelID channel_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Adaptez le type si nécessaire
          CHANGE COLUMN eventStat status TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL;
        `);
    console.log("Structure de la table 'events' mise à jour.");

    // --- Étape 6 : Migrer et transformer les données de eventParticipation
    const [eventRows] = await db.query(`SELECT id, users, status FROM events`);

    for (const row of eventRows) {
      const eventParticipationString = row.users;
      const eventStatus = row.status;

      const usersArray = [];
      let newstatus;

      if (eventStatus === 'Ouvert') newstatus = 'true';
      else if (eventStatus === 'Fermer') newstatus = 'false';

      if (eventParticipationString && eventParticipationString.length > 0) {
        const userCategoryPairs = eventParticipationString.split(';');
        for (const pair of userCategoryPairs) {
          if (pair.length > 0) {
            let userId = '';
            let category = '';
            let waiting = false;
            let effectivePair = pair;

            if (pair.startsWith('W_')) {
              waiting = true;
              effectivePair = pair.substring(2);
            }

            const [cat, id] = effectivePair.split('-');
            userId = id;
            category = cat;

            if (userId) {
              usersArray.push({
                id: userId,
                category: category,
                waiting: waiting,
              });
            }
          }
        }
      }

      await db.query(`UPDATE events SET users = ?, status = ? WHERE id = ?`, [
        JSON.stringify(usersArray),
        newstatus,
        row.id,
      ]);
    }
    console.log('Migration et transformation des données terminées.');

    // --- Étape 7 : Renommer les colonnes de la table 'presets'
    await db.query(`
          ALTER TABLE presets
          CHANGE COLUMN presetID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- Adapt type/constraints if needed
          CHANGE COLUMN presetName name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN presetCategory categories TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Renamed
          CHANGE COLUMN presetLicence licence TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; -- Renamed and data will be transformed
        `);
    console.log("Structure de la table 'presets' mise à jour.");

    // --- Étape 8 : Migration et transformation de la données de la colonne 'licence'
    const [presetRows] = await db.query(`SELECT id, licence FROM presets`);

    for (const row of presetRows) {
      const oldLicenceValue = row.licence;

      let newLicenceValue = null;

      if (oldLicenceValue === 'Oui') {
        newLicenceValue = 'true';
      } else if (oldLicenceValue === 'Non') {
        newLicenceValue = 'false';
      }

      await db.query(`UPDATE presets SET licence = ? WHERE id = ?`, [
        newLicenceValue,
        row.id,
      ]);
    }
    console.log('Migration de la données de la table presets terminée.');

    // --- Étape 9 : Transformation de la table 'sanctions'
    await db.query(`
          ALTER TABLE sanctions
          CHANGE COLUMN sanctionID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- Adapt type/constraints if needed
          CHANGE COLUMN authorID author_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN targetID target_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN sanctionDescription description LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN sanctionPointRemove point_remove INT(20) NULL DEFAULT NULL, -- Renamed
          CHANGE COLUMN returnTimestamp return_timestamp TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; -- Renamed
        `);
    console.log('Transformation de la table sanctions terminée.');

    // --- Étape  10 : Transformation de la table 'tracks'
    await db.query(`
      ALTER TABLE tracks
      CHANGE COLUMN trackID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- Adapt type/constraints if needed
      CHANGE COLUMN authorID author_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Note: type change from varchar(20) to varchar(9) for id
      CHANGE COLUMN trackFlag flag TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
      CHANGE COLUMN trackCountry country TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
      CHANGE COLUMN trackName name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
      CHANGE COLUMN trackLength duration TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Renamed to duration
      CHANGE COLUMN trackImage image TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Renamed to image
      CHANGE COLUMN trackGameId game_id TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Renamed to game_id
      DROP COLUMN trackStat; -- Dropping the old trackStat column
    `);
    console.log('Transformation de la table tracks terminée.');

    // --- Étape 11 : Créer une view event
    await db.query(`CREATE VIEW viewEvents AS
        SELECT
            e.id AS id,
            e.track_id AS trackId,
            e.preset_id AS presetId,
            e.description AS description,
            e.timestamp AS timestamp,
            e.message_id AS messageId,
            e.channel_id AS channelId,
            e.users AS registered,
            e.status AS status,

            t.name AS trackName,
            t.duration AS trackLength,
            t.image AS trackImage,
            -- --- Modification ici ---
            CONCAT(t.flag, '-', t.country) AS trackNationality, -- Concaténation de flag et country
            -- --- Fin de la modification ---

            p.name AS presetName,
            p.categories AS presetCategory,
            p.licence AS presetLicence

        FROM
            events e
        LEFT JOIN
            tracks t ON e.track_id = t.id
        LEFT JOIN
            presets p ON e.preset_id = p.id;
        `);
    console.log('Création de la vue event terminée.');

    // --- Étape 12 : Créer une view pour l'ancienne structure d'évenement
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

    // --- Étape 13 : Changement de nom de table
    await db.query(`ALTER TABLE teamsprofil RENAME TO teams;`);
    console.log("Renommination de la table 'teamsprofil' terminée.");

    // --- Étape 14 : Transformation de la table 'teams'
    await db.query(`
      ALTER TABLE teams
        CHANGE COLUMN teamID id VARCHAR(20),
        CHANGE COLUMN teamName name TEXT,
        CHANGE COLUMN teamAbreviation abrev TEXT,
        CHANGE COLUMN teamColor color TEXT,
        CHANGE COLUMN teamRole role TEXT,
        CHANGE COLUMN teamDrivers drivers LONGTEXT,
        CHANGE COLUMN teamLogo logo TEXT,
        CHANGE COLUMN teamNationality nationality TEXT,
        CHANGE COLUMN creationTimestamp creation_timestamp TEXT,
        CHANGE COLUMN teamStatus status TEXT;
    `);

    // --- Étape 15 : Suppression des anciennes tables
    await db.query(`
      DROP TABLE IF EXISTS channels, requests, servers, settings;
    `);
    console.log('Suppression des anciennces tables terminée.');
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  databaseMigration,
};
