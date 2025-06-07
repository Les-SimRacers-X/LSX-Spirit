const Papa = require('papaparse');
const axios = require('axios');
const { Events, EmbedBuilder } = require('discord.js');
const { Config } = require('../context/config');
const db = require('../handlers/loadDataBase');
const {
  interactionGlobalBotGestion,
} = require('../components/modules/module-events/interactionGlobalGestion');
const {
  licenceAndTeamActionsComponent,
} = require('../components/modules/module-licence/licenceAndTeamActions');
const { databaseMigration } = require('../context/data/migration');
require('dotenv').config();

module.exports = {
  name: Events.MessageCreate,
  async execute(bot, message) {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!import') {
      const member = await message.guild.members.fetch(message.author.id);
      if (!member.roles.cache.has(Config.roles.admin)) {
        return;
      } else {
        async function fetchSheetData() {
          const url =
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGaqycSyg1AGPzLuGJe2HJtC_Jv6jIqWlYZS4dKEh_w0RYSuhLO2ZHRFhaBn7F3RsFcElWfKIRUpmF/pub?gid=0&single=true&output=csv';
          try {
            const response = await axios.get(url);
            const csvText = response.data;

            const parsed = Papa.parse(csvText, { header: true });
            const data = parsed.data;

            for (const row of data) {
              const gamerTag = row['Gamertag Forcé'];
              const discordUsername = row['Pseudo Discord'];
              let trigramme = row['TRI'] ? row['TRI'].trim() : '';

              // Si le trigramme est vide, on le génère à partir du gamerTag
              if (!trigramme) {
                let letters = (gamerTag.match(/[a-zA-Z]/g) || [])
                  .slice(0, 3)
                  .join('')
                  .toUpperCase();
                while (letters.length < 3) {
                  letters += String.fromCharCode(65 + Math.random() * 26); // Complète avec des lettres aléatoires
                }
                trigramme = letters;
              }
              const number = row['N°'];
              const idPSXBOX = row['ID PS / XBOX'];
              const platform =
                row['ID PS / XBOX'].charAt(0) === 'P'
                  ? 'Playstation'
                  : row['ID PS / XBOX'].charAt(0) === 'M'
                    ? 'Xbox'
                    : 'Inconnu';
              const discordID = row['ID Discord'];

              if (!discordID || discordID.trim() === '') continue;

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
                    'None',
                    '#2f3136',
                    idPSXBOX,
                    platform,
                    12,
                  ]
                );
            }
            console.log('Données insérées en BDD !');
          } catch (error) {
            console.error("Erreur lors de l'import des données :", error);
          }
        }

        await fetchSheetData();
        message.delete();
        message.reply("Données en cours d'importation depuis le google sheet");
      }
    }

    if (message.content.toLowerCase() === 'send:embeds') {
      const member = await message.guild.members.fetch(message.author.id);
      if (!member.roles.cache.has('1324563836619063387')) {
        return;
      } else {
        const embedConfiguration = new EmbedBuilder()
          .setColor(Config.colors.default)
          .setDescription(
            `## 🤖 Gestion du bot\nLe sélecteur ci-dessous vous donne accès à la gestion des événements et des différents paramètres qui les accompagnent.`
          );

        bot.channels.cache.get(Config.channels.botGestion).send({
          embeds: [embedConfiguration],
          components: [interactionGlobalBotGestion()],
        });

        const embedLSXFunction = new EmbedBuilder()
          .setColor(Config.colors.default)
          .setDescription(
            `## ✨ Fonctionnalités LSX\n Utilisez le menu déroulant ci-dessous pour accéder à diverses fonctionnalités liées ) votre licence et aux équipes.`
          );

        bot.channels.cache.get(Config.channels.licence).send({
          embeds: [embedLSXFunction],
          components: [licenceAndTeamActionsComponent()],
        });
      }
    }

    if (message.content.toLowerCase() === 'migration:admin') {
      await databaseMigration();
    }
  },
};
