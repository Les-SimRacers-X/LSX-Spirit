const Papa = require("papaparse")
const axios = require("axios")
const { Events, EmbedBuilder } = require("discord.js")
const { Config } = require("../context/config")
const db = require("../handlers/loadDataBase")
const {
  interactionGlobalBotGestion,
} = require("../modules/module-events/interactionGlobalGestion")
const {
  licenceAndTeamActionsComponent,
} = require("../modules/module-licence/licenceAndTeamActions")
require("dotenv").config()

module.exports = {
  name: Events.MessageCreate,
  async execute(bot, message) {
    if (message.author.bot) return

    if (message.content.toLowerCase() === "!import") {
      const member = await message.guild.members.fetch(message.author.id)
      if (!member.roles.cache.has(Config.roles.admin)) {
        return
      } else {
        async function fetchSheetData() {
          const url =
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGaqycSyg1AGPzLuGJe2HJtC_Jv6jIqWlYZS4dKEh_w0RYSuhLO2ZHRFhaBn7F3RsFcElWfKIRUpmF/pub?gid=0&single=true&output=csv"
          try {
            const response = await axios.get(url)
            const csvText = response.data

            const parsed = Papa.parse(csvText, { header: true })
            const data = parsed.data

            for (const row of data) {
              const gamerTag = row["Gamertag Forcé"]
              const discordUsername = row["Pseudo Discord"]
              let trigramme = row["TRI"] ? row["TRI"].trim() : ""

              // Si le trigramme est vide, on le génère à partir du gamerTag
              if (!trigramme) {
                let letters = (gamerTag.match(/[a-zA-Z]/g) || [])
                  .slice(0, 3)
                  .join("")
                  .toUpperCase()
                while (letters.length < 3) {
                  letters += String.fromCharCode(65 + Math.random() * 26) // Complète avec des lettres aléatoires
                }
                trigramme = letters
              }
              const number = row["N°"]
              const idPSXBOX = row["ID PS / XBOX"]
              const platform =
                row["ID PS / XBOX"].charAt(0) === "P"
                  ? "Playstation"
                  : row["ID PS / XBOX"].charAt(0) === "M"
                  ? "Xbox"
                  : "Inconnu"
              const discordID = row["ID Discord"]

              if (!discordID || discordID.trim() === "") continue

              await db
                .promise()
                .query(
                  `INSERT INTO users (userID, discordUsername, inGameUsername, trigramme, inGameNumber, teamID, embedColor, platformID, platformConsole, licencePoints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    discordID,
                    discordUsername,
                    gamerTag,
                    trigramme,
                    number,
                    "None",
                    "#2f3136",
                    idPSXBOX,
                    platform,
                    12,
                  ]
                )
            }
            console.log("Données insérées en BDD !")
          } catch (error) {
            console.error("Erreur lors de l'import des données :", error)
          }
        }

        await fetchSheetData()
        message.delete()
        message.reply("Données en cours d'importation depuis le google sheet")
      }
    }

    if (message.content.toLowerCase() === "send:embeds") {
      const member = await message.guild.members.fetch(message.author.id)
      if (!member.roles.cache.has("1349479229234090138")) {
        return
      } else {
        const embedConfiguration = new EmbedBuilder()
          .setColor(Config.colors.default)
          .setDescription(
            `## 🤖 Gestion du bot\nLe sélecteur ci-dessous vous donne accès à la gestion des événements et des différents paramètres qui les accompagnent.`
          )

        bot.channels.cache.get(Config.channels.botGestion).send({
          embeds: [embedConfiguration],
          components: [interactionGlobalBotGestion()],
        })

        const embedLSXFunction = new EmbedBuilder()
          .setColor(Config.colors.default)
          .setDescription(
            `## ✨ Fonctionnalités LSX\n Utilisez le menu déroulant ci-dessous pour accéder à diverses fonctionnalités liées ) votre licence et aux équipes.`
          )

        bot.channels.cache.get(Config.channels.licence).send({
          embeds: [embedLSXFunction],
          components: [licenceAndTeamActionsComponent()],
        })
      }
    }

    if (message.content.toLowerCase() === "migration") {
      try {
        console.log("Début de la migration des données...")
        // --- Étape 1 : Ajoute de la colonne accounts_config
        await db.query(
          `ALTER TABLE users ADD COLUMN accounts_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT '{}'`
        )
        console.log("Colonne 'accounts_config' ajoutée.")

        // --- Étape 2 : Migrer les données vers accounts_config
        const [rows] = await db.query(
          `SELECT id, inGameUsername, trigramme, inGameNumber, platformID, platformConsole FROM users`
        )
        for (const row of rows) {
          const accountConfig = {
            acc: {
              id: row.platformID,
              name: row.inGameUsername,
              trigram: row.trigram,
              platform: row.platformConsole,
              number: Number(row.inGameNumber),
            },
          }

          await db.query(`UPDATE users SET accounts_config = ? WHERE id = ?`, [
            JSON.stringify(accountConfig),
            row.id,
          ])
        }
        console.log("Migration des données vers 'accounts_config' terminée.")

        // --- Étape 3 : Suppression des anciennes colonnes
        await db.query(`
          ALTER TABLE users
          DROP COLUMN inGameUsername,
          DROP COLUMN trigramme,
          DROP COLUMN inGameNumber,
          DROP COLUMN platformID,
          DROP COLUMN platformConsole;
          `)
        console.log("Anciennes colonnes supprimées.")

        // --- Étape 4 : Renommer les colonnes restantes
        await db.query(`
          ALTER TABLE users
          CHANGE COLUMN userID id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          CHANGE COLUMN discordUsername username TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN teamID team_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN licencePoints licence_points INT(11) NOT NULL DEFAULT 0,
          CHANGE COLUMN totalRaces total_races INT(11) NOT NULL DEFAULT 0,
          CHANGE COLUMN lastSanctionID sanction_id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL;
        `)
        console.log("Colonnes de la table 'users' renommer avec succès")

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
        `)
        console.log("Structure de la table 'events' mise à jour.")

        // --- Étape 6 : Migrer et transformer les données de eventParticipation
        const [eventRows] = await db.query(`SELECT id, users FROM events`)

        for (const row of eventRows) {
          const eventParticipationString = row.users

          let usersArray = []

          if (eventParticipationString && eventParticipationString.length > 0) {
            const userCategoryPairs = eventParticipationString.split(";")
            for (const pair of userCategoryPairs) {
              if (pair.length > 0) {
                let userId = ""
                let category = ""
                let waiting = false

                if (pair.startsWith("W_")) {
                  waiting = true

                  const cleanPair = pair.substring(2)
                  const parts = cleanPair.split("-")
                  userId = parts[0] || ""
                  category = parts[1] || ""
                } else {
                  const parts = cleanPair.split("-")
                  userId = parts[0] || ""
                  category = parts[1] || ""
                }

                if (userId) {
                  usersArray.push({
                    id: userId,
                    category: category,
                    waiting: waiting,
                  })
                }
              }
            }
          }

          await db.query(`UPDATE events SET users = ? WHERE id = ?`, [
            JSON.stringify(usersArray),
            row.id,
          ])
        }
        console.log("Migration et transformation des données terminées.")

        // --- Étape 7 : Renommer les colonnes de la table 'presets'
        await db.query(`
          ALTER TABLE presets
          CHANGE COLUMN presetID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- Adapt type/constraints if needed
          CHANGE COLUMN presetName name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN presetCategory categories TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL, -- Renamed
          CHANGE COLUMN presetLicence licence TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; -- Renamed and data will be transformed
        `)
        console.log("Structure de la table 'presets' mise à jour.")

        // --- Étape 8 : Migration et transformation de la données de la colonne 'licence'
        const [presetRows] = await db.query(`SELECT id, licence FROM presets`)

        for (const row of presetRows) {
          const oldLicenceValue = row.licence

          let newLicenceValue = null

          if (oldLicenceValue === "Oui") {
            newLicenceValue = "true"
          } else if (oldLicenceValue === "Non") {
            newLicenceValue = "false"
          }

          await db.query(`UPDATE presets SET licence = ? WHERE id = ?`, [
            newLicenceValue,
            row.id,
          ])
        }

        // --- Étape 9 : Transformation de la table 'sanctions'
        await db.query(`
          ALTER TABLE sanctions
          CHANGE COLUMN sanctionID id VARCHAR(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, -- Adapt type/constraints if needed
          CHANGE COLUMN authorID author_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN targetID target_id VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN sanctionDescription description LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
          CHANGE COLUMN sanctionPointRemove point_remove INT(20) NULL DEFAULT NULL, -- Renamed
          CHANGE COLUMN returnTimestamp return_timestamp TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; -- Renamed
        `)
      } catch (error) {
        console.error(error)
      }
    }
  },
}
