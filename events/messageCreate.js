const Config = require("../config")
const Papa = require("papaparse")
const axios = require("axios")
const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js")
const {
  licenceAndTeamActionsComponent,
} = require("../components/licenceAndTeamActions")
require("dotenv").config()

module.exports = {
  name: Events.MessageCreate,
  async execute(bot, message) {
    let db = bot.db
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
      if (!member.roles.cache.has(Config.roles.admin)) {
        return
      } else {
        try {
          const [rows] = await db
            .promise()
            .query(`SELECT * FROM requests WHERE requestStat = ?`, ["waiting"])
          const embedGestionOfAllBotInteractions = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `## 📊 GESTION GLOBAL\n\n\n ➡️ ***Utilisez le sélecteur ci-dessous pour gérer le bot et accéder aux différentes interactions disponibles.***\n\n*__Liste des drapeaux :__ [Cliquez ici](https://emojipedia.org/fr/drapeaux)*`
            )

          const interactionGestionOfAllBotInteractions =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.StringSelectMenuBuilder()
                .setCustomId(`gestionAllBot_Interactions`)
                .setPlaceholder("📌 Séléctionner une option...")
                .addOptions(
                  {
                    emoji: "📌",
                    label: "Séléctionner une option",
                    description: "...",
                    value: "0",
                    default: true,
                  },
                  {
                    emoji: "📆",
                    label: "Créer un événement",
                    description: "Créer un nouvel événement !",
                    value: "7",
                  },
                  {
                    emoji: "⚙️",
                    label: "Gestion des événements",
                    description:
                      "Gérer vos événements (Fermer, supprimer, etc...)",
                    value: "8",
                  },
                  {
                    emoji: "📨",
                    label: `Demande d'Adhésion (${rows.length})`,
                    description:
                      "Visualisez les demandes d'adhésion à l'entrylist",
                    value: "10",
                  },
                  {
                    emoji: "💬",
                    label: "Ajouter un salon",
                    description: "Ajouter des salons pour vos événements",
                    value: "1",
                  },
                  {
                    emoji: "🗯️",
                    label: "Gestion des salons",
                    description: "Gérer vos salons (supprimer, modifier)",
                    value: "2",
                  },
                  {
                    emoji: "🚦",
                    label: "Ajouter un preset",
                    description: "Créer vos propres présets",
                    value: "3",
                  },
                  {
                    emoji: "🎨",
                    label: "Gestion des presets",
                    description: "Gérer les différents presets d'évenement",
                    value: "4",
                  },
                  {
                    emoji: "🏁",
                    label: "Ajouter un circuit",
                    description:
                      "Ajouter des circuits (Drapeau, Pays, Circuit, Longueur, Image)",
                    value: "5",
                  },
                  {
                    emoji: "🚧",
                    label: "Gestion des circuits",
                    description: "Gérer vos circuits (Activer ou Désactiver)",
                    value: "6",
                  },
                  {
                    emoji: "🔨",
                    label: "Règlement",
                    description: "Modifier le règlement de course",
                    value: "9",
                  }
                )
            )

          /* await bot.channels.cache.get(Config.channels.gestionChannel).send({
            embeds: [embedGestionOfAllBotInteractions],
            components: [interactionGestionOfAllBotInteractions],
          }) */

          const embedTeamAndPersonnalProfils = new EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `## 📘 Informations\n \n- **Créer et personnaliser son profil** avec des infos comme Pseudo, Platform, Numéro de joueur, etc...\n- **Consulter son profil et celui des autres** pour voir leurs historique et leurs équipes.\n- **Créer et gérer une équipe** en définissant un nom, un logo et éventuellement un objectif.\n- **Rejoindre une équipe existante** en envoyant une demande ou en étant invité.\n-# Si vous avez le moindre soucis, merci d'ouvrir un ticket !`
            )

          await bot.channels.cache.get("1339169354989830208").send({
            embeds: [embedTeamAndPersonnalProfils],
            components: [licenceAndTeamActionsComponent()],
          })
        } catch (error) {
          console.error(error)
        }
      }
    }
  },
}
