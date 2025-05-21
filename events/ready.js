const loadSlashCommand = require("../loader/loadSlashCommand")
const db = require("../loader/loadDataBase")
const { Config } = require("../utils/config")
const ftp = require("basic-ftp")
const { Writable } = require("stream")
const { currentTimestamp } = require("../utils/js/utils")
const { Events } = require("discord.js")

module.exports = {
  name: Events.ClientReady,
  async execute(bot) {
    async function connectToDataBase() {
      try {
        const connection = await db.getConnection()

        console.log("✅ Database connection established succesfully !")
        connection.release()

        db.on("error", async function (err) {
          console.log("❌ Database ERROR :", err)
          if (err.code === "ECONNRESET") {
            try {
              const newConnection = await db.getConnection()
              console.log("✅ Database successfully reconnected !")
              newConnection.release()
            } catch (errDB) {
              console.error(
                "❌ Erreur lors de la reconnexion à la base de données :",
                errDB
              )
            }
          } else {
            throw err
          }
        })
      } catch (error) {
        console.error(
          "❌ Erreur lors de la connexion à la base de données :",
          error
        )
      }
    }

    await connectToDataBase()

    await loadSlashCommand(bot)

    // Fonction pour vérifier si deux timestamps correspondent au même jour
    function isSameDay(timestamp1, timestamp2) {
      const date1 = new Date(timestamp1)
      const date2 = new Date(timestamp2)

      // console.log(`Comparaison des dates : ${date1.toISOString()} et ${date2.toISOString()}`);

      return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
      )
    }

    // Fonction principale pour récupérer les événements du jour
    async function getEventOfTheDay() {
      try {
        // Récupération des événements depuis la base de données
        const [events] = await db.query(`SELECT * FROM events`)
        const currentTimestamp = Date.now() // Timestamp actuel en millisecondes

        // console.log("Timestamp actuel :", currentTimestamp, new Date(currentTimestamp).toISOString());

        // Filtrer les événements ayant lieu aujourd'hui
        const eventsToday = events.filter((event) => {
          const eventTimestamp = Number(event.eventTimestamp) * 1000 // Conversion en millisecondes si nécessaire
          // console.log(`Vérification pour l'événement ${event.eventID} : Timestamp ${eventTimestamp}, Date ${new Date(eventTimestamp).toISOString()}`);
          return isSameDay(currentTimestamp, eventTimestamp)
        })

        if (eventsToday.length !== 0) {
          // console.log("Événements aujourd'hui :", eventsToday);
          for (const event of eventsToday) {
            const [presets] = await bot.db
              .promise()
              .query(`SELECT * FROM presets WHERE presetID = ?`, [
                event.eventPresetID,
              ])
            const preset = presets[0]

            const eventTimestamp = Number(event.eventTimestamp) * 1000 // Conversion en millisecondes
            const timeUntilEvent = eventTimestamp - currentTimestamp

            // Diviser les catégories en fonction de ";"
            const categoryEntries = preset.presetCategory
              .split(";")
              .filter((entry) => entry)
            const categories = categoryEntries.map((entry) => {
              const [differentCategory] = entry.split("-")
              return { differentCategory }
            })

            // Récupérer le salon et le message liés à l'événement
            const reqChannel = await bot.channels.fetch(event.eventChannelID)
            const message = await reqChannel.messages.fetch(
              event.eventMessageID
            )

            if (message) {
              try {
                if (timeUntilEvent > 15 * 60 * 1000) {
                  setTimeout(async () => {
                    try {
                      const [settings] = await bot.db
                        .promise()
                        .query(`SELECT * FROM settings WHERE settingID = ?`, [
                          "1",
                        ])
                      const settingsData = settings[0]

                      // Vérifier si un thread à déjà été créer !
                      let existingThread = reqChannel.threads.cache.find(
                        (thread) => thread.id === message.id
                      )

                      if (existingThread) {
                        console.log(
                          `Un thread existe déjà pour le message ${message.id} (${existingThread.id}).`
                        )
                        return
                      } else {
                        existingThread = await reqChannel.threads.create({
                          name: "Événement du jour !",
                          autoArchiveDuration: 1440, // 24 heures
                          type: Discord.ChannelType.PublicThread,
                          startMessage: message.id,
                        })

                        console.log("Nouveau thread créé :", existingThread.id)
                      }

                      const participations = event.eventParticipation.split(";")
                      const usersID = participations
                        .filter((participation) =>
                          categories.some((eventCategory) =>
                            participation.startsWith(
                              `${eventCategory.differentCategory}-`
                            )
                          )
                        )
                        .map((participation) => participation.split("-")[1])

                      const users = await Promise.all(
                        usersID.map((userID) =>
                          bot.users.fetch(userID).catch(() => null)
                        )
                      )
                      const userList = users
                        .filter((user) => user)
                        .map((user) => `${user}`)
                        .join(", ")

                      const rulesAuthor = await bot.users
                        .fetch(settingsData.settingStat)
                        .catch(() => null)

                      const embedRules = new Discord.EmbedBuilder()
                        .setColor(Config.colors.mainServerColor)
                        .setDescription(
                          `### 📌 Règlement de l'événement\n\n${
                            settingsData.setting
                          }\n\n-# Rédigé par ${
                            rulesAuthor.globalName || rulesAuthor.username
                          }`
                        )

                      await bot.db
                        .promise()
                        .query(
                          `UPDATE events SET eventStat = ? WHERE eventID = ?`,
                          ["Fermer", event.eventID]
                        )
                      console.log(
                        `Événement ${event.eventID} marqué comme fermé.`
                      )

                      await existingThread.send({
                        content: `## 🟢 L'événement commence à <t:${Math.floor(
                          eventTimestamp / 1000
                        )}:t> (<t:${Math.floor(eventTimestamp / 1000)}:R>)\n${
                          userList || "Aucun participant."
                        }`,
                        embeds: [embedRules],
                      })
                    } catch (error) {
                      console.error(
                        `Erreur lors de la gestion du thread pour l'événement ${event.eventID}:`,
                        error
                      )
                      const embedErrorDetectionLog = new Discord.EmbedBuilder()
                        .setColor(Config.colors.mainServerColor)
                        .setTitle("📌 Erreur Détectée :")
                        .setDescription(`\`\`\`${error}\`\`\``)
                        .setTimestamp()

                      await bot.channels.cache
                        .get(Config.channels.errorlogChannel)
                        .send({ embeds: [embedErrorDetectionLog] })
                    }
                  }, timeUntilEvent - 15 * 60 * 1000)
                }
              } catch (error) {
                console.error(
                  "Erreur lors de la vérification ou de la création du thread :",
                  error
                )

                const embedErrorDetectionLog = new Discord.EmbedBuilder()
                  .setColor(Config.colors.mainServerColor)
                  .setTitle("📌 Erreur Détectée :")
                  .setDescription(`\`\`\`${error}\`\`\``)
                  .setTimestamp()

                await bot.channels.cache
                  .get(Config.channels.errorlogChannel)
                  .send({ embeds: [embedErrorDetectionLog] })
              }
            } else {
              console.log(
                `Message introuvable pour l'événement ${event.eventID}.`
              )
            }
          }
        } else {
          console.log("Aucun événement pour aujourd'hui.")
        }
      } catch (error) {
        const embedError = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détectée :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        console.error("Erreur lors de la récupération des événements :", error)
        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedError] })
      }
    }

    // Modifier le nom de la catégorie en fonction du nombre de membres
    async function updateCategoryName(guild) {
      try {
        const categoryId = "1130557618792955905"
        const categoryChannel = guild.channels.cache.get(categoryId)

        if (
          !categoryChannel ||
          categoryChannel.type !== Discord.ChannelType.GuildCategory
        ) {
          console.error(
            "La catégorie n'existe pas ou n'est pas une catégorie valide."
          )
          return
        }

        const memberCount = guild.memberCount

        await categoryChannel.setName(`📰 GÉNÉRAL : ${memberCount} Membres 📰`)
      } catch (error) {
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détecté :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedErrorDetectionLog] })
      }
    }

    // Modifier le nom de la catégorie en fonction du nombre de membres avec un rôle spécifique
    async function updateRoleCategoryName(guild) {
      try {
        const categoryId = "1166445624653262898"
        const roleId = "1166375974435311697"
        const categoryChannel = guild.channels.cache.get(categoryId)

        if (
          !categoryChannel ||
          categoryChannel.type !== Discord.ChannelType.GuildCategory
        ) {
          console.error(
            "La catégorie n'existe pas ou n'est pas une catégorie valide."
          )
          return
        }

        // Compter le nombre de membres ayant le rôle
        const role = guild.roles.cache.get(roleId)
        if (!role) {
          console.error("Le rôle spécifié n'existe pas.")
          return
        }

        const roleMemberCount = role.members.size

        // Mettre à jour le nom de la catégorie
        await categoryChannel.setName(
          `🏆Team LSX : ${roleMemberCount} Pilotes🏆`
        )
      } catch (error) {
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détecté :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        const embedErrorDetected = new Discord.EmbedBuilder()
          .setColor(Config.colors.crossColor)
          .setDescription(
            "💥 **Une erreur a été détectée lors de votre interaction !**"
          )

        console.error(error)
        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedErrorDetectionLog] })
        await interaction.reply({
          embeds: [embedErrorDetected],
          ephemeral: true,
        })
      }
    }

    // Listener pour les événements de membre ajoutés ou supprimés, et mise à jour des deux catégories
    bot.on("guildMemberAdd", (member) => {
      updateCategoryName(member.guild)
      updateRoleCategoryName(member.guild)
    })
    bot.on("guildMemberRemove", (member) => {
      updateCategoryName(member.guild)
      updateRoleCategoryName(member.guild)
    })

    // Listener pour les changements de rôles
    bot.on("guildMemberUpdate", (oldMember, newMember) => {
      if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        updateRoleCategoryName(newMember.guild)
      }
    })

    // Fonction pour lire des fichiers en FTP
    async function fetchRemoteDataFromServer(serverConfig) {
      const client = new ftp.Client()
      client.ftp.verbose = true

      try {
        await client.access({
          host: serverConfig.serverHost,
          user: serverConfig.serverUser,
          password: serverConfig.serverPassword,
          port: serverConfig.serverPort,
          secure: false,
        })

        const downloadToBuffer = async (remotePath) => {
          let buffer = Buffer.from("")
          const writable = new Writable({
            write(chunk, encoding, callback) {
              buffer = Buffer.concat([buffer, chunk])
              callback()
            },
          })
          await client.downloadTo(writable, remotePath)
          return buffer.toString()
        }

        // Lire le fichier server.log
        const logStream = await downloadToBuffer("/log/server.log")
        let logData = logStream.toString()

        logData = logData.trim()
        logData = logData.replace(/[\u0000-\u001F\u007F]/g, "")

        // Rechercher la phrase "Server supports crossplay"
        const crossplatform = logData.includes("Server supports crossplay")
          ? "Oui"
          : "Non"

        // Lire le fichier settings.json
        const settingStream = await downloadToBuffer(
          "/cfg/current/settings.txt"
        )
        let settingsData = settingStream.toString()

        settingsData = settingsData.trim()
        settingsData = settingsData.replace(/[\u0000-\u001F\u007F]/g, "")

        // Rechercher la phrase ["randomizeTrackWhenEmpty": 1]
        const randomizeTrackWhenEmpty = settingsData.includes(
          '"randomizeTrackWhenEmpty": 1'
        )
          ? "Oui"
          : "Non"

        let settingsParsedData = JSON.parse(settingsData)

        const serverName = settingsParsedData.serverName
        const serverCarCategory = settingsParsedData.carGroup

        // Lire le fichier event.json
        const eventStream = await downloadToBuffer("/cfg/current/event.txt")
        let eventData = eventStream.toString()

        eventData = eventData.trim()
        eventData = eventData.replace(/[\u0000-\u001F\u007F]/g, "")

        let eventParsedData = JSON.parse(eventData)

        const track = eventParsedData.track
        const ambientTemp = eventParsedData.ambientTemp
        const couldLevel = eventParsedData.cloudLevel
        const rainLevel = eventParsedData.rain
        const weatherRandomness = eventParsedData.weatherRandomness

        const sessions = eventParsedData.sessions
        let sessionKeys = ""

        for (const session of sessions) {
          const hourOfDay = session.hourOfDay
          const dayOfWeekend = session.dayOfWeekend
          const sessionType = session.sessionType
          const sessionDurationMinutes = session.sessionDurationMinutes

          // Créer une clé de session dans un format spécifique
          const sessionKey = `;${hourOfDay}-${dayOfWeekend}-${sessionType}-${sessionDurationMinutes}`

          sessionKeys += sessionKey
        }

        const [tracks] = await bot.db
          .promise()
          .query(`SELECT * FROM tracks WHERE trackGameID = ?`, [track])
        const trackData = tracks[0]

        await bot.db
          .promise()
          .query(
            `UPDATE servers SET serverName = ?, serverIsCrossPlay = ?, serverRandomizedTrack = ?, serverSessions = ?, serverCarCategory = ?, serverTrackID = ?, serverAmbientTemp = ?, serverweatherRandomness = ?, serverCloudLevel = ?, serverRainLevel = ? WHERE serverID = ?`,
            [
              serverName,
              crossplatform,
              randomizeTrackWhenEmpty,
              sessionKeys,
              serverCarCategory,
              trackData.trackID,
              ambientTemp,
              weatherRandomness,
              couldLevel,
              rainLevel,
              serverConfig.serverID,
            ]
          )
      } catch (error) {
        console.error(
          `Erreur lors de la récupération des informations en FTP :`,
          error
        )
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détecté :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedErrorDetectionLog] })
      } finally {
        client.close()
      }
    }

    async function updateAllServers() {
      try {
        // Récupérer tous les serveurs depuis la base de données
        const [servers] = await db.query(`SELECT * FROM servers`)

        // Traiter chaque serveur
        for (const serverConfig of servers) {
          console.log(`Mise à jour du serveur ${serverConfig.serverID}...`)
          await fetchRemoteDataFromServer(serverConfig)
        }
      } catch (error) {
        console.error(`Erreur lors de la mise à jour des serveurs :`, error)
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détecté :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedErrorDetectionLog] })
      }
    }

    async function sendOrUpdateServerEmbedDisplay() {
      try {
        const [servers] = await db.query(`SELECT * FROM servers`)

        // Pour chaque ligne dans la table servers
        for (const server of servers) {
          // Gérer les différents états des différents paramètres

          let crossplayStatus =
            server.serverIsCrossPlay === "Oui" ? `XBOX Séries/PS5` : `Désactivé`
          let weatherRandomnessPercentage = Math.round(
            (server.serverWeatherRandomness / 7) * 100
          )
          let carCategoryStatus =
            server.serverCarCategory === "FreeForAll"
              ? `Toutes les catégories`
              : server.serverCarCategory

          const dayOfWeek = ["", "Vendredi", "Samedi", "Dimanche"]
          const sessionType = {
            P: "Essais Libres",
            Q: "Qualifications",
            R: "Course",
          }

          function transformSession(sessionData) {
            const [
              hourOfDay,
              dayOfWeekend,
              sessionTypeCode,
              sessionDurationMinutes,
            ] = sessionData.split("-")

            const hour = `${hourOfDay}h`
            const day = dayOfWeek[dayOfWeekend]
            const type = sessionType[sessionTypeCode]

            // Conversion des minutes en heures et minutes
            const minutes = parseInt(sessionDurationMinutes, 10)
            const hours = Math.floor(minutes / 60)
            const remainingMinutes = minutes % 60
            const duration =
              hours > 0
                ? `${hours}h${
                    remainingMinutes > 0 ? ` ${remainingMinutes}min` : "00"
                  }`
                : `${remainingMinutes} minutes`

            return `◽ *${day} ${hour}* : ${type} (${duration})`
          }

          const sessions = server.serverSessions
            .split(";")
            .filter((session) => session)
            .map((session) => transformSession(session))

          const allSessions = sessions.join("\n")

          const [tracks] = await bot.db
            .promise()
            .query(`SELECT * FROM tracks WHERE trackID = ?`, [
              server.serverTrackID,
            ])
          const track = tracks[0]

          const embedServerDisplay = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### 🌐 ${
                server.serverName
              }\n\n__**Informations session :**__\n> ${
                track.trackFlag
              } __Circuit :__ ${track.trackName} (${
                track.trackLength
              })\n> 🏷️ __Catégorie :__ ${carCategoryStatus}\n> 🎮 __Crossplay :__ ${crossplayStatus}\n> 🔀 __Circuit aléatoire :__ ${
                server.serverRandomizedTrack
              }\n\n__**Conditions de piste :**__\n> 🌡️ __Température de l'air :__ ${
                server.serverAmbientTemp
              }°C\n> 🌧️ __Intensité de pluie :__ ${
                server.serverRainLevel * 100
              }%\n> ☁️ __Converture nuageuse :__ ${
                server.serverCloudLevel * 100
              }%\n> 🌦️ __Météo dynamique :__ ${weatherRandomnessPercentage}%\n\n__**Format :**__\n${allSessions}`
            )
            .setImage(track.trackImage)
            .setTimestamp()

          const threadID = "1324498938828427295"

          if (server.serverStat === "public") {
            if (server.serverEmbedMessageID === "") {
              const sendMessageServerMonitoring = await bot.channels.cache
                .get("1132938881411596379")
                .send({ embeds: [embedServerDisplay] })
              const messageID = sendMessageServerMonitoring.id

              await bot.db
                .promise()
                .query(
                  `UPDATE servers SET serverEmbedMessageID = ? WHERE serverID = ?`,
                  [messageID, server.serverID]
                )
            } else {
              const channel = await bot.channels.cache.get(
                "1132938881411596379"
              )
              const messageToUpdate = await channel.messages.fetch(
                server.serverEmbedMessageID
              )
              await messageToUpdate.edit({ embeds: [embedServerDisplay] })
            }
          } else {
            if (server.serverEmbedMessageID === "") {
              const channel = await bot.channels.cache.get(
                "1132938881411596379"
              )
              const thread = channel.threads.cache.find(
                (t) => t.id === threadID
              )

              const sendMessageServerMonitoring = await thread.send({
                embeds: [embedServerDisplay],
              })
              const messageID = sendMessageServerMonitoring.id

              await bot.db
                .promise()
                .query(
                  `UPDATE servers SET serverEmbedMessageID = ? WHERE serverID = ?`,
                  [messageID, server.serverID]
                )
            } else {
              const channel = await bot.channels.cache.get(
                "1132938881411596379"
              )
              const thread = channel.threads.cache.find(
                (t) => t.id === threadID
              )

              const messageToUpdate = await thread.messages.fetch(
                server.serverEmbedMessageID
              )
              await messageToUpdate.edit({ embeds: [embedServerDisplay] })
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi des embeds :`, error)
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détecté :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        await bot.channels.cache
          .get(Config.channels.errorlogChannel)
          .send({ embeds: [embedErrorDetectionLog] })
      }
    }

    async function checkSanctions() {
      const timestamp = currentTimestamp()

      try {
        // Récupérer tous les utilisateurs avec un lastSanctionID
        const [users] = await bot.db
          .promise()
          .query(
            `SELECT userID, lastSanctionID FROM users WHERE lastSanctionID IS NOT NULL`
          )

        if (users.length === 0) return // Aucun utilisateur concerné

        for (const { userID, lastSanctionID } of users) {
          // Vérifier si returnTimestamp de cette sanction est atteint
          const [sanction] = await bot.db
            .promise()
            .query(
              `SELECT sanctionID FROM sanctions WHERE sanctionID = ? AND returnTimestamp <= ?`,
              [lastSanctionID, timestamp]
            )

          if (sanction.length > 0) {
            // Mise à jour des licencePoints pour l'utilisateur
            await bot.db
              .promise()
              .query(
                `UPDATE users SET licencePoints = LEAST(licencePoints + 12, 100) WHERE userID = ?`,
                [userID]
              )

            console.log(`Points restaurés pour l'utilisateur ${userID}`)
          }
        }
      } catch (error) {
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor("White")
          .setTitle("📌 Erreur Détectée :")
          .setDescription(`\`\`\`${error}\`\`\``)
          .setTimestamp()

        console.error(error)
        await bot.channels.cache
          .get("1321920324119560435")
          .send({ embeds: [embedErrorDetectionLog] })
      }
    }

    setInterval(checkSanctions, 24 * 60 * 60 * 1000)
    checkSanctions()

    // Listener pour les événements de membre ajoutés ou supprimés
    bot.on("guildMemberAdd", (member) => updateCategoryName(member.guild))
    bot.on("guildMemberRemove", (member) => updateCategoryName(member.guild))

    // Définir une intervalle pour mettre à jour les serveurs
    const updateInterval = 10 * 60 * 1000 // 5 minutes en millisecondes
    setInterval(updateAllServers, updateInterval)

    updateAllServers()

    // Définir une intervalle pour mettre à jour les embeds de serveurs
    const updateEmbedInterval = 1 * 60 * 1000 // 2 minutes en millisecondes
    setInterval(sendOrUpdateServerEmbedDisplay, updateEmbedInterval)

    sendOrUpdateServerEmbedDisplay()

    // Définir une intervalle pour vérifier les événements
    const interval = 5 * 60 * 1000 // 5 minutes en millisecondes
    setInterval(getEventOfTheDay, interval)

    getEventOfTheDay()

    console.log(`${bot.user.tag} is now ON !`)
  },
}
