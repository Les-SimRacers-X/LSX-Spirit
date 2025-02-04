const Discord = require("discord.js")
const Config = require("../config.json")
const axios = require("axios")
const { generateID, getXboxId, errorHandler } = require("../utils")

module.exports = async (bot, interaction) => {
  let db = bot.db

  // Gestion des Applications User Commands
  if (interaction.type === Discord.InteractionType.ApplicationCommand) {
    const command = bot.commands.get(interaction.commandName)
    if (!command) return

    try {
      await command.run(bot, interaction, interaction.options)
    } catch (error) {
      const embedErrorDetectionLog = new Discord.EmbedBuilder()
        .setColor(Config.colors.mainServerColor)
        .setTitle("📌 Erreur Détecté :")
        .setDescription(`\`\`\`${error}\`\`\``)
        .setTimestamp()

      const embedErrorDetected = new Discord.EmbedBuilder()
        .setColor(Config.colors.crossColor)
        .setDescription(
          "💥 **Une erreur a été détecté lors de votre interaction !**"
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

  if (interaction.isButton()) {
    // Interaction pour changer l'état d'un circuit
    const [fromManagingTrack, trackID] = interaction.customId.split("_")
    if (fromManagingTrack === "changeTrackStat") {
      try {
        const [tracks] = await db
          .promise()
          .query(`SELECT * FROM tracks WHERE trackID = ?`, [trackID])
        const track = tracks[0]

        let newTrackStat
        if (track.trackStat === "Activer") {
          newTrackStat = "Desactiver"
          await db
            .promise()
            .query(`UPDATE tracks SET trackStat = ? WHERE trackID = ? `, [
              newTrackStat,
              trackID,
            ])
        } else {
          newTrackStat = "Activer"
          await db
            .promise()
            .query(`UPDATE tracks SET trackStat = ? WHERE trackID = ?`, [
              newTrackStat,
              trackID,
            ])
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Gérer la pagination du système de circuit pour les deux boutons "◀" et "▶"
    const [fromManagingTracksPrevious, previousTrackIndex] =
      interaction.customId.split("_")
    if (fromManagingTracksPrevious === "previousTrack") {
      // Refaire le même code que dans l'interaction "managing_tracks"
      try {
        const [trackList] = await db.promise().query(`SELECT * FROM tracks`)
        const [countResult] = await db
          .promise()
          .query(`SELECT COUNT(*) AS total FROM tracks`)

        let currentTrackIndex = previousTrackIndex // Récupérer l'index actuelle
        // Puis le réduire de 1 pour revenir au circuit précédent
        currentTrackIndex--

        const totalTracks = countResult[0].total

        // Reprendre la même condition que l'interaction précédente
        if (totalTracks === 0) {
          const embedNoTracksAvailable = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `**${Config.emojis.crossEmoji} Aucun circuit n'a été ajouter !**`
            )

          return interaction.reply({
            embeds: [embedNoTracksAvailable],
            ephemeral: true,
          })
        } else {
          const currentTrack = trackList[currentTrackIndex]

          let checkTrackStatus,
            ButtonLabel,
            ButtonStyle,
            checkPreviousTrackIndex,
            checkNextTrackIndex
          let checkCurrentTrackIndex = currentTrackIndex

          // Faire des vérifications pour le début de la pagination
          if (
            currentTrackIndex === 0 &&
            checkCurrentTrackIndex + 1 === totalTracks
          ) {
            checkPreviousTrackIndex = true
            checkNextTrackIndex = true
          } else if (currentTrackIndex === 0) {
            checkPreviousTrackIndex = true
            checkNextTrackIndex = false
          } else if (checkCurrentTrackIndex + 1 === totalTracks) {
            checkPreviousTrackIndex = false
            checkNextTrackIndex = true
          } else {
            checkPreviousTrackIndex = false
            checkNextTrackIndex = false
          }

          // Le switch case va nous permettre de gérer les status des circuits
          switch (currentTrack.trackStat) {
            case "Activer":
              checkTrackStatus = `🟢 Activé`
              ButtonLabel = `Désactivé`
              ButtonStyle = Discord.ButtonStyle.Danger
              break

            case "Desactiver":
              checkTrackStatus = `🔴 Désactivé`
              ButtonLabel = `Activé`
              ButtonStyle = Discord.ButtonStyle.Success
              break
          }

          const user = await interaction.client.users.fetch(
            currentTrack.authorID
          )

          // Display à l'utilisateur les informations sur le circuit
          const embedTrackInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### ${currentTrack.trackFlag} ${currentTrack.trackName}, ${currentTrack.trackCountry}\n- Longueur du circuit : ${currentTrack.trackLength}\n- Status du circuit : **${checkTrackStatus}**\n- Auteur : ${user} (${user.username})\n- Identification : ${user.id}`
            )
            .setFooter({
              text: `Circuit : ${currentTrackIndex + 1} sur ${totalTracks}`,
            })

          const interactionButtonTrackManagment = new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`previousTrack_${currentTrackIndex}`)
                .setEmoji("◀️")
                .setDisabled(checkPreviousTrackIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`nextTrack_${currentTrackIndex}`)
                .setEmoji("▶️")
                .setDisabled(checkNextTrackIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`changeTrackStat_${currentTrack.trackID}`)
                .setLabel(ButtonLabel)
                .setDisabled(false)
                .setStyle(ButtonStyle)
            )

          // Petite modification lors de l'envoi de l'interaction, au lieu de "reply", on met "update"
          await interaction.update({
            embeds: [embedTrackInformations],
            components: [interactionButtonTrackManagment],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    const [fromManagingTracksNext, nextTrackIndex] =
      interaction.customId.split("_")
    if (fromManagingTracksNext === "nextTrack") {
      try {
        const [trackList] = await db.promise().query(`SELECT * FROM tracks`)
        const [countResult] = await db
          .promise()
          .query(`SELECT COUNT(*) AS total FROM tracks`)

        let currentTrackIndex = nextTrackIndex // Récupérer l'index actuelle
        // Puis augmenter de 1 pour passer au circuit suivant
        currentTrackIndex++

        const totalTracks = countResult[0].total

        // Reprendre la même condition que l'interaction précédente
        if (totalTracks === 0) {
          const embedNoTracksAvailable = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `**${Config.emojis.crossEmoji} Aucun circuit n'a été ajouter !**`
            )

          return interaction.reply({
            embeds: [embedNoTracksAvailable],
            ephemeral: true,
          })
        } else {
          const currentTrack = trackList[currentTrackIndex]

          let checkTrackStatus,
            ButtonLabel,
            ButtonStyle,
            checkPreviousTrackIndex,
            checkNextTrackIndex
          let checkCurrentTrackIndex = currentTrackIndex

          // Faire des vérifications pour le début de la pagination
          if (
            currentTrackIndex === 0 &&
            checkCurrentTrackIndex + 1 === totalTracks
          ) {
            checkPreviousTrackIndex = true
            checkNextTrackIndex = true
          } else if (currentTrackIndex === 0) {
            checkPreviousTrackIndex = true
            checkNextTrackIndex = false
          } else if (checkCurrentTrackIndex + 1 === totalTracks) {
            checkPreviousTrackIndex = false
            checkNextTrackIndex = true
          } else {
            checkPreviousTrackIndex = false
            checkNextTrackIndex = false
          }

          // Le switch case va nous permettre de gérer les status des circuits
          switch (currentTrack.trackStat) {
            case "Activer":
              checkTrackStatus = `🟢 Activé`
              ButtonLabel = `Désactivé`
              ButtonStyle = Discord.ButtonStyle.Danger
              break

            case "Desactiver":
              checkTrackStatus = `🔴 Désactivé`
              ButtonLabel = `Activé`
              ButtonStyle = Discord.ButtonStyle.Success
              break
          }

          const user = await interaction.client.users.fetch(
            currentTrack.authorID
          )

          // Display à l'utilisateur les informations sur le circuit
          const embedTrackInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### ${currentTrack.trackFlag} ${currentTrack.trackName}, ${currentTrack.trackCountry}\n- Longueur du circuit : ${currentTrack.trackLength}\n- Status du circuit : **${checkTrackStatus}**\n- Auteur : ${user} (${user.username})\n- Identification : ${user.id}`
            )
            .setFooter({
              text: `Circuit : ${currentTrackIndex + 1} sur ${totalTracks}`,
            })

          const interactionButtonTrackManagment = new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`previousTrack_${currentTrackIndex}`)
                .setEmoji("◀️")
                .setDisabled(checkPreviousTrackIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`nextTrack_${currentTrackIndex}`)
                .setEmoji("▶️")
                .setDisabled(checkNextTrackIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`changeTrackStat_${currentTrack.trackID}`)
                .setLabel(ButtonLabel)
                .setDisabled(false)
                .setStyle(ButtonStyle)
            )

          // Petite modification lors de l'envoi de l'interaction, au lieu de "reply", on met "update"
          await interaction.update({
            embeds: [embedTrackInformations],
            components: [interactionButtonTrackManagment],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Interaction pour changer l'état d'un événement
    const [fromManagingEvent, eventID] = interaction.customId.split("_")
    if (fromManagingEvent === "changeEventStat") {
      try {
        const [events] = await db
          .promise()
          .query(`SELECT * FROM events WHERE eventID = ?`, [eventID])
        const event = events[0]

        let newEventStat
        if (event.eventStat === "Ouvert") {
          newEventStat = "Fermer"
          await db
            .promise()
            .query(`UPDATE events SET eventStat = ? WHERE eventID = ? `, [
              newEventStat,
              eventID,
            ])
        } else {
          newEventStat = "Ouvert"
          await db
            .promise()
            .query(`UPDATE events SET eventStat = ? WHERE eventID = ?`, [
              newEventStat,
              eventID,
            ])
        }

        const embedEventStatUpdated = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **L'état de l'événement a bien été mis à jour !**`
          )

        await interaction.reply({
          embeds: [embedEventStatUpdated],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Gérer la pagination du système d'événement pour les deux boutons "◀" et "▶"
    const [fromManagingEventsPrevious, previousEventIndex] =
      interaction.customId.split("_")
    if (fromManagingEventsPrevious === "previousEvent") {
      try {
        // Récupérer toutes les informations de la table "tracks"
        const [eventList] = await db.promise().query(`SELECT * FROM events`)
        const [countResult] = await db
          .promise()
          .query(`SELECT COUNT(*) AS total FROM events`)

        let currentEventIndex = previousEventIndex
        currentEventIndex--

        const totalEvents = countResult[0].total

        // D'abord une condition pour vérifier si il n'y a pas de circuit
        if (totalEvents === 0) {
          const embedNoEventAvailable = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `**${Config.emojis.crossEmoji} Aucun événement n'a été créer !**`
            )

          return interaction.reply({
            embeds: [embedNoEventAvailable],
            ephemeral: true,
          })
        } else {
          const currentEvent = eventList[currentEventIndex]

          const [tracks] = await db
            .promise()
            .query(`SELECT * FROM tracks WHERE trackID = ?`, [
              currentEvent.eventTrackID,
            ])
          const track = tracks[0]

          let checkEventStatus,
            ButtonLabel,
            ButtonStyle,
            checkPreviousEventIndex,
            checkNextEventIndex
          let checkCurrentEventIndex = currentEventIndex

          // Faire des vérifications pour le début de la pagination
          if (
            currentEventIndex === 0 &&
            checkCurrentEventIndex + 1 === totalEvents
          ) {
            checkPreviousEventIndex = true
            checkNextEventIndex = true
          } else if (currentEventIndex === 0) {
            checkPreviousEventIndex = true
            checkNextEventIndex = false
          } else if (checkCurrentEventIndex + 1 === totalEvents) {
            checkPreviousEventIndex = false
            checkNextEventIndex = true
          } else {
            checkPreviousEventIndex = false
            checkNextEventIndex = false
          }

          // Le switch case va nous permettre de gérer les status des events
          switch (currentEvent.eventStat) {
            case "Ouvert":
              checkEventStatus = `🟢 Inscription Ouvert`
              ButtonLabel = `Fermer`
              ButtonStyle = Discord.ButtonStyle.Danger
              break

            case "Fermer":
              checkEventStatus = `🔴 Inscription Fermé`
              ButtonLabel = `Ouvert`
              ButtonStyle = Discord.ButtonStyle.Success
              break
          }

          const participations = currentEvent.eventParticipation.split(";")
          let participationLenght
          if (participations.length === 1) {
            participationLenght = "0"
          } else {
            participationLenght = participations.length - 1
          }

          // Afficher l'embed d'informations sur l'évènement
          const embedEventInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `## 📅 Informations de l'évènement\n\n- Circuit : ${track.trackName}, ${track.trackCountry} (${track.trackFlag})\n- Preset ID : **${currentEvent.eventPresetID}**\n- Nombre de participant : ${participationLenght}\n- Status : **${checkEventStatus}**\n- Date & Heure : <t:${currentEvent.eventTimestamp}:D> (**<t:${currentEvent.eventTimestamp}:R>**)`
            )
            .setFooter({
              text: `Évènement : ${currentEventIndex + 1} sur ${totalEvents}`,
            })

          const interactionButtonEventManagment = new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`previousEvent_${currentEventIndex}`)
                .setEmoji("◀️")
                .setDisabled(checkPreviousEventIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`nextEvent_${currentEventIndex}`)
                .setEmoji("▶️")
                .setDisabled(checkNextEventIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`changeEventStat_${currentEvent.eventID}`)
                .setLabel(ButtonLabel)
                .setDisabled(false)
                .setStyle(ButtonStyle)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`deleteEvent_${currentEvent.eventID}`)
                .setEmoji("🗑️")
                .setLabel("Supprimer")
                .setDisabled(false)
                .setStyle(Discord.ButtonStyle.Primary)
            )

          await interaction.update({
            embeds: [embedEventInformations],
            components: [interactionButtonEventManagment],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    const [fromManagingEventsNext, nextEventIndex] =
      interaction.customId.split("_")
    if (fromManagingEventsNext === "nextEvent") {
      try {
        // Récupérer toutes les informations de la table "tracks"
        const [eventList] = await db.promise().query(`SELECT * FROM events`)
        const [countResult] = await db
          .promise()
          .query(`SELECT COUNT(*) AS total FROM events`)

        let currentEventIndex = nextEventIndex
        currentEventIndex++

        const totalEvents = countResult[0].total

        // D'abord une condition pour vérifier si il n'y a pas de circuit
        if (totalEvents === 0) {
          const embedNoEventAvailable = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `**${Config.emojis.crossEmoji} Aucun événement n'a été créer !**`
            )

          return interaction.reply({
            embeds: [embedNoEventAvailable],
            ephemeral: true,
          })
        } else {
          const currentEvent = eventList[currentEventIndex]

          const [tracks] = await db
            .promise()
            .query(`SELECT * FROM tracks WHERE trackID = ?`, [
              currentEvent.eventTrackID,
            ])
          const track = tracks[0]

          let checkEventStatus,
            ButtonLabel,
            ButtonStyle,
            checkPreviousEventIndex,
            checkNextEventIndex
          let checkCurrentEventIndex = currentEventIndex

          // Faire des vérifications pour le début de la pagination
          if (
            currentEventIndex === 0 &&
            checkCurrentEventIndex + 1 === totalEvents
          ) {
            checkPreviousEventIndex = true
            checkNextEventIndex = true
          } else if (currentEventIndex === 0) {
            checkPreviousEventIndex = true
            checkNextEventIndex = false
          } else if (checkCurrentEventIndex + 1 === totalEvents) {
            checkPreviousEventIndex = false
            checkNextEventIndex = true
          } else {
            checkPreviousEventIndex = false
            checkNextEventIndex = false
          }

          // Le switch case va nous permettre de gérer les status des events
          switch (currentEvent.eventStat) {
            case "Ouvert":
              checkEventStatus = `🟢 Inscription Ouvert`
              ButtonLabel = `Fermer`
              ButtonStyle = Discord.ButtonStyle.Danger
              break

            case "Fermer":
              checkEventStatus = `🔴 Inscription Fermé`
              ButtonLabel = `Ouvert`
              ButtonStyle = Discord.ButtonStyle.Success
              break
          }

          const participations = currentEvent.eventParticipation.split(";")
          let participationLenght
          if (participations.length === 1) {
            participationLenght = "0"
          } else {
            participationLenght = participations.length - 1
          }

          // Afficher l'embed d'informations sur l'évènement
          const embedEventInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `## 📅 Informations de l'évènement\n\n- Circuit : ${track.trackName}, ${track.trackCountry} (${track.trackFlag})\n- Preset ID : **${currentEvent.eventPresetID}**\n- Nombre de participant : ${participationLenght}\n- Status : **${checkEventStatus}**\n- Date & Heure : <t:${currentEvent.eventTimestamp}:D> (**<t:${currentEvent.eventTimestamp}:R>**)`
            )
            .setFooter({
              text: `Évènement : ${currentEventIndex + 1} sur ${totalEvents}`,
            })

          const interactionButtonEventManagment = new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`previousEvent_${currentEventIndex}`)
                .setEmoji("◀️")
                .setDisabled(checkPreviousEventIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`nextEvent_${currentEventIndex}`)
                .setEmoji("▶️")
                .setDisabled(checkNextEventIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`changeEventStat_${currentEvent.eventID}`)
                .setLabel(ButtonLabel)
                .setDisabled(false)
                .setStyle(ButtonStyle)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`deleteEvent_${currentEvent.eventID}`)
                .setEmoji("🗑️")
                .setLabel("Supprimer")
                .setDisabled(false)
                .setStyle(Discord.ButtonStyle.Primary)
            )

          await interaction.update({
            embeds: [embedEventInformations],
            components: [interactionButtonEventManagment],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Interaction pour supprimer un événement
    const [fromDeletingEvent, eventId] = interaction.customId.split("_")
    if (fromDeletingEvent === "deleteEvent") {
      try {
        // Récupérer l'événement à supprimer depuis la base de données
        const [events] = await db
          .promise()
          .query(`SELECT * FROM events WHERE eventID = ?`, [eventId])
        const event = events[0]

        if (!event) {
          const embedEventNotFound = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              "❌ **L'événement n'a pas été trouvé dans la base de données.**"
            )

          return await interaction.reply({
            embeds: [embedEventNotFound],
            ephemeral: true,
          })
        }

        // Supprimer le message associé à l'événement
        try {
          const channel = await bot.channels.fetch(event.eventChannelID) // Récupérer le salon
          const message = await channel.messages.fetch(event.eventMessageID) // Récupérer le message

          if (message) {
            await message.delete()
            console.log(`Message lié à l'événement ${eventId} supprimé.`)
          } else {
            console.log(`Message non trouvé pour l'événement ${eventId}.`)
          }
        } catch (messageError) {
          console.error(
            `Erreur lors de la suppression du message de l'événement ${eventId} :`,
            messageError
          )
        }

        // Supprimer l'événement de la base de données
        await db
          .promise()
          .query(`DELETE FROM events WHERE eventID = ?`, [eventId])

        // Répondre à l'interaction
        const embedEventDeleted = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **L'événement et son message associé ont bien été supprimés !**`
          )

        await interaction.update({
          embeds: [embedEventDeleted],
          components: [],
          ephemeral: true,
        })
      } catch (error) {
        const embedErrorDetectionLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle("📌 Erreur Détectée :")
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

    // Interaction pour supprimer un preset
    const [fromDeletingPreset, presetId] = interaction.customId.split("_")
    if (fromDeletingPreset === "deletePreset") {
      try {
        // Vérifier si le salon existe
        const [presetExist] = await db
          .promise()
          .query(`SELECT * FROM presets WHERE presetID = ?`, [presetId])
        if (!presetExist.length) {
          const embedPresetNotFound = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setDescription(`⚠️ **Le preset n'a pas été retrouvé !**`)

          return interaction.reply({
            embeds: [embedPresetNotFound],
            ephemeral: true,
          })
        }

        // Supprimer le salon
        await db
          .promise()
          .query(`DELETE FROM presets WHERE presetID = ?`, [presetId])

        const embedPresetDeleted = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **Le preset a bien été supprimé**`
          )

        await interaction.update({
          embeds: [embedPresetDeleted],
          components: [],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction "registerParticipation" pour déclencher la suite d'interaction pour les disponibilités
    const [fromValidateEventCreation, category] =
      interaction.customId.split("_")
    if (fromValidateEventCreation === "registerParticipation") {
      try {
        // Récupérer l'ID du message
        const messageID = interaction.message.id

        // Récupérer l'évènement que nous avons créer
        const [eventsBeforeUpdate] = await db
          .promise()
          .query(`SELECT * FROM events WHERE eventMessageID = ?`, [messageID])
        const eventBeforeUpdate = eventsBeforeUpdate[0]

        // Condition pour vérifier si l'événement est ouvert ou pas
        if (eventBeforeUpdate.eventStat === "Fermer") {
          const embedEventClosed = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `${Config.emojis.crossEmoji} **Les inscriptions et modifications à l'événement sont acutellement fermé !**`
            )

          return interaction.reply({
            embeds: [embedEventClosed],
            ephemeral: true,
          })
        } else {
          // Récupérer les informations nécessaire comme le circuit ou les presets !
          const [tracks] = await db
            .promise()
            .query(`SELECT * FROM tracks WHERE trackID = ?`, [
              eventBeforeUpdate.eventTrackID,
            ])
          const track = tracks[0]

          const [presets] = await db
            .promise()
            .query(`SELECT * FROM presets WHERE presetID = ?`, [
              eventBeforeUpdate.eventPresetID,
            ])
          const preset = presets[0]

          // Étape 1 : Diviser les catégories en fonction de ";"
          const categoryEntries = preset.presetCategory
            .split(";")
            .filter((entry) => entry) // Filtrer pour éviter les chaînes vides

          // Étape 2 : Parcourir et extraire les données
          const categories = categoryEntries.map((entry) => {
            const [category, maxParticipants] = entry.split("-") // Diviser la catégorie et le nombre d'utilisateur max
            return { category, maxParticipants: parseInt(maxParticipants, 10) } // Retourner un objet avec les deux
          })

          // Récupérer la liste des participants
          const participations = eventBeforeUpdate.eventParticipation.split(";")

          // Trouver la catégorie correspondante
          const categoryDetails = categories.find(
            (cat) => cat.category === category
          )

          // Vérifier si l'utilisateur est déjà dans la liste ou dans la wait list
          const userInCategory = participations.find(
            (participation) =>
              participation === `${category}-${interaction.user.id}` ||
              participation === `W_${category}-${interaction.user.id}`
          )

          // Vérifier si l'utilisateur est déjà inscrit dans une autre catégorie ou dans une waitlist
          const userAlreadyRegistered = participations.some((participation) => {
            const [currentCategory, userID] = participation
              .replace("W_", "")
              .split("-")
            return (
              userID === interaction.user.id && currentCategory !== category
            )
          })

          if (userAlreadyRegistered) {
            const embedAlreadyRegistered = new Discord.EmbedBuilder()
              .setColor("Yellow")
              .setDescription(
                `⚠️ **Vous êtes déjà inscrit dans une autre catégorie ou dans une waitlist. Vous ne pouvez pas vous inscrire à la catégorie \`${category}\`**.`
              )

            return await interaction.reply({
              embeds: [embedAlreadyRegistered],
              ephemeral: true,
            })
          }

          if (userInCategory) {
            // Supprimer l'utilisateur de la liste ou de la waitlist
            const updatedParticipations = participations.filter(
              (participation) => participation !== userInCategory
            )

            // Vérifier si l'utilisateur était sur la waitlist, on ne fait rien de plus
            if (userInCategory.startsWith("W_")) {
              await db
                .promise()
                .query(
                  `UPDATE events SET eventParticipation = ? WHERE eventMessageID = ?`,
                  [updatedParticipations.join(";"), messageID]
                )

              const [eventsAfterUpdate] = await db
                .promise()
                .query(`SELECT * FROM events WHERE eventMessageID = ?`, [
                  messageID,
                ])
              const eventAfterUpdate = eventsAfterUpdate[0]
              const participationsAfterUpdate =
                eventAfterUpdate.eventParticipation.split(";")

              // Créer l'embed d'évènement
              const embedEventDisplay = new Discord.EmbedBuilder()
                .setColor(Config.colors.mainServerColor)
                .setDescription(
                  `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${eventAfterUpdate.eventDescription}\n\n- **📅 Date :** <t:${eventAfterUpdate.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${eventAfterUpdate.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
                )
                .setImage(track.trackImage)

              // Parcourir chaque catégorie
              for (const { category, maxParticipants } of categories) {
                // Filtrer les utilisateurs correspondant à la catégorie
                const usersID = participationsAfterUpdate
                  .filter((participation) =>
                    participation.startsWith(`${category}-`)
                  )
                  .map((participation) => participation.split("-")[1]) // Filtrer par catégorie et récupérer uniquement l'ID de l'utilisateur

                // Récupérer les utilisateurs depuis leurs ID
                const users = await Promise.all(
                  usersID.map((userID) =>
                    interaction.client.users.fetch(userID).catch(() => null)
                  )
                ) // Récupérer les utilisateurs

                // Créer la liste des noms d'utilisateurs ou afficher "Aucun participant"
                const userList = users
                  .filter((user) => user)
                  .map((user) => `> ${user.globalName || user.username}`)
                  .join("\n")

                embedEventDisplay.addFields({
                  name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
                  value: userList || "> Aucun Participant",
                  inline: true,
                })
              }

              // Récupérer les utilisateurs sur la waitlist
              const waitlistUsersID = participationsAfterUpdate
                .filter((participation) => participation.startsWith(`W_`))
                .map((participation) => {
                  const [category, userID] = participation.split("-") // Sépare en deux parties
                  const formattedCategory = category.replace("W_", "") // Retire le "W_" de la catégorie
                  return { userID, category: formattedCategory } // Retourne un objet
                })

              // Récupérer les utilisateurs depuis leurs IDs
              const waitingUsers = await Promise.all(
                waitlistUsersID.map(async (user) => {
                  try {
                    const fetchedUser = await interaction.client.users.fetch(
                      user.userID
                    )
                    return {
                      username: fetchedUser.globalName || fetchedUser.username,
                      category: user.category,
                    }
                  } catch {
                    return null // Ignore si l'utilisateur ne peut pas être récupéré
                  }
                })
              )

              const waitlistDescription = waitingUsers
                .filter((user) => user)
                .map((user) => `> ${user.username} (*${user.category}*)`)
                .join("\n")

              embedEventDisplay.addFields({
                name: `Liste d'attente`,
                value: waitlistDescription || "Aucun utilisateur en attente.",
                inline: false,
              })

              const embedRemovedFromWaitList = new Discord.EmbedBuilder()
                .setColor(Config.colors.checkColor)
                .setDescription(
                  `${Config.emojis.checkEmoji} **Vous avez été retiré de la waitlist pour la catégorie \`${category}\`**`
                )

              const messageToUpdate = await interaction.channel.messages.fetch(
                messageID
              )
              await messageToUpdate.edit({
                content: `<@&1159104795173466184>`,
                embeds: [embedEventDisplay],
              })
              return await interaction.reply({
                embeds: [embedRemovedFromWaitList],
                ephemeral: true,
              })
            }

            // Récupérer l'ID de l'utilisateur qui interagit
            const userID = interaction.user.id

            // Supprimer l'utilisateur qui interagit de la liste principale
            const userIndex = participations.findIndex(
              (p) => p === `${category}-${userID}`
            )
            if (userIndex !== -1) {
              participations.splice(userIndex, 1) // Retirer l'utilisateur de la liste principale
            }

            // Récupérer l'utilisateur de la waitlist
            const waitlistedUserIndex = participations.findIndex((p) =>
              p.startsWith(`W_${category}-`)
            )
            if (waitlistedUserIndex !== -1) {
              const waitlistedUser = participations[waitlistedUserIndex]

              // Retirer le préfixe "W_" et ajouter l'utilisateur à la liste principale
              const promotedUser = waitlistedUser.replace("W_", "")
              participations.push(promotedUser)

              // Supprimer l'utilisateur promu de la waitlist
              participations.splice(waitlistedUserIndex, 1)

              // Mettre à jour la base de données
              await db
                .promise()
                .query(
                  `UPDATE events SET eventParticipation = ? WHERE eventMessageID = ?`,
                  [participations.join(";"), messageID]
                )

              // Mettre à jour l'embed
              const [updatedEvents] = await db
                .promise()
                .query(`SELECT * FROM events WHERE eventMessageID = ?`, [
                  messageID,
                ])
              const updatedEvent = updatedEvents[0]

              try {
                const promotedUserID = promotedUser.split("-")[1]
                const promotedUserObject = await interaction.client.users.fetch(
                  promotedUserID
                )

                const embedPromoted = new Discord.EmbedBuilder()
                  .setColor(Config.colors.checkColor)
                  .setDescription(
                    `🎉 **${
                      promotedUserObject.globalName ||
                      promotedUserObject.username
                    } a été promu de la liste d'attente à la catégorie \`${category}\`**`
                  )

                await promotedUserObject.send({ embeds: [embedPromoted] })
              } catch (error) {
                console.error(
                  `Erreur lors de l'envoi du message de promotion :`,
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
              }

              const embedEventDisplay = new Discord.EmbedBuilder()
                .setColor(Config.colors.mainServerColor)
                .setDescription(
                  `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${updatedEvent.eventDescription}\n\n- **📅 Date :** <t:${updatedEvent.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${updatedEvent.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
                )
                .setImage(track.trackImage)

              // Réorganiser les participations pour l'affichage
              const participationsAfterUpdate = participations
              for (const { category, maxParticipants } of categories) {
                const usersID = participationsAfterUpdate
                  .filter((p) => p.startsWith(`${category}-`))
                  .map((p) => p.split("-")[1])
                const users = await Promise.all(
                  usersID.map((id) =>
                    interaction.client.users.fetch(id).catch(() => null)
                  )
                )
                const userList =
                  users
                    .filter((u) => u)
                    .map((u) => `> ${u.globalName || u.username}`)
                    .join("\n") || "> Aucun Participant"

                embedEventDisplay.addFields({
                  name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
                  value: userList,
                  inline: true,
                })
              }

              const waitlistUsersID = participationsAfterUpdate
                .filter((p) => p.startsWith("W_"))
                .map((p) => {
                  const [cat, id] = p.split("-")
                  return { category: cat.replace("W_", ""), userID: id }
                })
              const waitingUsers = await Promise.all(
                waitlistUsersID.map(async ({ userID, category }) => {
                  try {
                    const user = await interaction.client.users.fetch(userID)
                    return {
                      username: user.globalName || user.username,
                      category,
                    }
                  } catch {
                    return null
                  }
                })
              )

              const waitlistDescription = waitingUsers
                .filter((u) => u)
                .map((u) => `> ${u.username} (*${u.category}*)`)
                .join("\n")
              embedEventDisplay.addFields({
                name: "Liste d'attente",
                value: waitlistDescription || "Aucun utilisateur en attente.",
                inline: false,
              })

              // Embeds de réponse à l'utilisateur
              const embedResponse = new Discord.EmbedBuilder()
                .setColor(Config.colors.checkColor)
                .setDescription(
                  `${Config.emojis.checkEmoji} **Vous avez été retiré de l'évènement pour la catégorie \`${category}\`**`
                )

              const messageToUpdate = await interaction.channel.messages.fetch(
                messageID
              )
              await messageToUpdate.edit({
                content: `<@&1159104795173466184>`,
                embeds: [embedEventDisplay],
              })
              return await interaction.reply({
                embeds: [embedResponse],
                ephemeral: true,
              })
            }

            // Mise à jour si aucune promotion
            await db
              .promise()
              .query(
                `UPDATE events SET eventParticipation = ? WHERE eventMessageID = ?`,
                [updatedParticipations.join(";"), messageID]
              )

            const [eventsAfterUpdate] = await db
              .promise()
              .query(`SELECT * FROM events WHERE eventMessageID = ?`, [
                messageID,
              ])
            const eventAfterUpdate = eventsAfterUpdate[0]

            // Créer l'embed d'évènement
            const embedEventDisplay = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${eventAfterUpdate.eventDescription}\n\n- **📅 Date :** <t:${eventAfterUpdate.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${eventAfterUpdate.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
              )
              .setImage(track.trackImage)

            const participationsAfterUpdate =
              eventAfterUpdate.eventParticipation.split(";")
            // Parcourir chaque catégorie
            for (const { category, maxParticipants } of categories) {
              // Filtrer les utilisateurs correspondant à la catégorie
              const usersID = participationsAfterUpdate
                .filter((participation) =>
                  participation.startsWith(`${category}-`)
                )
                .map((participation) => participation.split("-")[1]) // Filtrer par catégorie et récupérer uniquement l'ID de l'utilisateur

              // Récupérer les utilisateurs depuis leurs ID
              const users = await Promise.all(
                usersID.map((userID) =>
                  interaction.client.users.fetch(userID).catch(() => null)
                )
              ) // Récupérer les utilisateurs

              // Créer la liste des noms d'utilisateurs ou afficher "Aucun participant"
              const userList = users
                .filter((user) => user)
                .map((user) => `> ${user.globalName || user.username}`)
                .join("\n")

              embedEventDisplay.addFields({
                name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
                value: userList || "> Aucun Participant",
                inline: true,
              })
            }

            // Récupérer les utilisateurs sur la waitlist
            const waitlistUsersID = participationsAfterUpdate
              .filter((participation) => participation.startsWith(`W_`))
              .map((participation) => {
                const [category, userID] = participation.split("-") // Sépare en deux parties
                const formattedCategory = category.replace("W_", "") // Retire le "W_" de la catégorie
                return { userID, category: formattedCategory } // Retourne un objet
              })

            // Récupérer les utilisateurs depuis leurs IDs
            const waitingUsers = await Promise.all(
              waitlistUsersID.map(async (user) => {
                try {
                  const fetchedUser = await interaction.client.users.fetch(
                    user.userID
                  )
                  return {
                    username: fetchedUser.globalName || fetchedUser.username,
                    category: user.category,
                  }
                } catch {
                  return null // Ignore si l'utilisateur ne peut pas être récupéré
                }
              })
            )

            const waitlistDescription = waitingUsers
              .filter((user) => user)
              .map((user) => `> ${user.username} (*${user.category}*)`)
              .join("\n")

            embedEventDisplay.addFields({
              name: `Liste d'attente`,
              value: waitlistDescription || "Aucun utilisateur en attente.",
              inline: false,
            })

            const embedRemovedFromParticipationList = new Discord.EmbedBuilder()
              .setColor(Config.colors.checkColor)
              .setDescription(
                `${Config.emojis.checkEmoji} **Vous avez été retiré de l'évènement pour la catégorie \`${category}\`**`
              )

            const messageToUpdate = await interaction.channel.messages.fetch(
              messageID
            )
            await messageToUpdate.edit({
              content: `<@&1159104795173466184>`,
              embeds: [embedEventDisplay],
            })
            return await interaction.reply({
              embeds: [embedRemovedFromParticipationList],
              ephemeral: true,
            })
          }

          // Compter les participants actuels dans cette catégorie
          const currentParticipants = participations.filter((participation) =>
            participation.startsWith(`${category}-`)
          )
          // Vérifier si la catégorie est pleine
          if (currentParticipants.length >= categoryDetails.maxParticipants) {
            // Ajouter à la waitlist
            participations.push(`W_${category}-${interaction.user.id}`)
            await db
              .promise()
              .query(
                `UPDATE events SET eventParticipation = ? WHERE eventMessageID = ?`,
                [participations.join(";"), messageID]
              )

            const [eventsAfterUpdate] = await db
              .promise()
              .query(`SELECT * FROM events WHERE eventMessageID = ?`, [
                messageID,
              ])
            const eventAfterUpdate = eventsAfterUpdate[0]

            // Créer l'embed d'évènement
            const embedEventDisplay = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${eventAfterUpdate.eventDescription}\n\n- **📅 Date :** <t:${eventAfterUpdate.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${eventAfterUpdate.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
              )
              .setImage(track.trackImage)

            const participationsAfterUpdate =
              eventAfterUpdate.eventParticipation.split(";")
            // Parcourir chaque catégorie
            for (const { category, maxParticipants } of categories) {
              // Filtrer les utilisateurs correspondant à la catégorie
              const usersID = participationsAfterUpdate
                .filter((participation) =>
                  participation.startsWith(`${category}-`)
                )
                .map((participation) => participation.split("-")[1]) // Filtrer par catégorie et récupérer uniquement l'ID de l'utilisateur

              // Récupérer les utilisateurs depuis leurs ID
              const users = await Promise.all(
                usersID.map((userID) =>
                  interaction.client.users.fetch(userID).catch(() => null)
                )
              ) // Récupérer les utilisateurs

              // Créer la liste des noms d'utilisateurs ou afficher "Aucun participant"
              const userList = users
                .filter((user) => user)
                .map((user) => `> ${user.globalName || user.username}`)
                .join("\n")

              embedEventDisplay.addFields({
                name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
                value: userList || "> Aucun Participant",
                inline: true,
              })
            }

            // Récupérer les utilisateurs sur la waitlist
            const waitlistUsersID = participationsAfterUpdate
              .filter((participation) => participation.startsWith(`W_`))
              .map((participation) => {
                const [category, userID] = participation.split("-") // Sépare en deux parties
                const formattedCategory = category.replace("W_", "") // Retire le "W_" de la catégorie
                return { userID, category: formattedCategory } // Retourne un objet
              })

            // Récupérer les utilisateurs depuis leurs IDs
            const waitingUsers = await Promise.all(
              waitlistUsersID.map(async (user) => {
                try {
                  const fetchedUser = await interaction.client.users.fetch(
                    user.userID
                  )
                  return {
                    username: fetchedUser.globalName || fetchedUser.username,
                    category: user.category,
                  }
                } catch {
                  return null // Ignore si l'utilisateur ne peut pas être récupéré
                }
              })
            )

            const waitlistDescription = waitingUsers
              .filter((user) => user)
              .map((user) => `> ${user.username} (*${user.category}*)`)
              .join("\n")

            embedEventDisplay.addFields({
              name: `Liste d'attente`,
              value: waitlistDescription || "Aucun utilisateur en attente.",
              inline: false,
            })

            const embedAddedToWaitingList = new Discord.EmbedBuilder()
              .setColor("Yellow")
              .setDescription(
                `⚠️ **La catégorie \`${category}\` est pleine. Vous avez été ajouté à la waitlist.**`
              )

            const messageToUpdate = await interaction.channel.messages.fetch(
              messageID
            )
            await messageToUpdate.edit({
              content: `<@&1159104795173466184>`,
              embeds: [embedEventDisplay],
            })
            return await interaction.reply({
              embeds: [embedAddedToWaitingList],
              ephemeral: true,
            })
          }

          // Ajouter l'utilisateur à la catégorie
          participations.push(`${category}-${interaction.user.id}`)
          await db
            .promise()
            .query(
              `UPDATE events SET eventParticipation = ? WHERE eventMessageID = ?`,
              [participations.join(";"), messageID]
            )

          const [eventsAfterUpdate] = await db
            .promise()
            .query(`SELECT * FROM events WHERE eventMessageID = ?`, [messageID])
          const eventAfterUpdate = eventsAfterUpdate[0]

          // Créer l'embed d'évènement
          const embedEventDisplay = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${eventAfterUpdate.eventDescription}\n\n- **📅 Date :** <t:${eventAfterUpdate.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${eventAfterUpdate.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
            )
            .setImage(track.trackImage)

          const participationsAfterUpdate =
            eventAfterUpdate.eventParticipation.split(";")

          // Parcourir chaque catégorie
          for (const { category, maxParticipants } of categories) {
            // Filtrer les utilisateurs correspondant à la catégorie
            const usersID = participationsAfterUpdate
              .filter((participation) =>
                participation.startsWith(`${category}-`)
              )
              .map((participation) => participation.split("-")[1]) // Filtrer par catégorie et récupérer uniquement l'ID de l'utilisateur

            // Récupérer les utilisateurs depuis leurs ID
            const users = await Promise.all(
              usersID.map((userID) =>
                interaction.client.users.fetch(userID).catch(() => null)
              )
            ) // Récupérer les utilisateurs

            // Créer la liste des noms d'utilisateurs ou afficher "Aucun participant"
            const userList = users
              .filter((user) => user)
              .map((user) => `> ${user.globalName || user.username}`)
              .join("\n")

            embedEventDisplay.addFields({
              name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
              value: userList || "> Aucun Participant",
              inline: true,
            })
          }

          // Récupérer les utilisateurs sur la waitlist
          const waitlistUsersID = participationsAfterUpdate
            .filter((participation) => participation.startsWith(`W_`))
            .map((participation) => {
              const [category, userID] = participation.split("-") // Sépare en deux parties
              const formattedCategory = category.replace("W_", "") // Retire le "W_" de la catégorie
              return { userID, category: formattedCategory } // Retourne un objet
            })

          // Récupérer les utilisateurs depuis leurs IDs
          const waitingUsers = await Promise.all(
            waitlistUsersID.map(async (user) => {
              try {
                const fetchedUser = await interaction.client.users.fetch(
                  user.userID
                )
                return {
                  username: fetchedUser.globalName || fetchedUser.username,
                  category: user.category,
                }
              } catch {
                return null // Ignore si l'utilisateur ne peut pas être récupéré
              }
            })
          )

          const waitlistDescription = waitingUsers
            .filter((user) => user)
            .map((user) => `> ${user.username} (*${user.category}*)`)
            .join("\n")

          embedEventDisplay.addFields({
            name: `Liste d'attente`,
            value: waitlistDescription || "Aucun utilisateur en attente.",
            inline: false,
          })

          const embedAddedToParticipationList = new Discord.EmbedBuilder()
            .setColor(Config.colors.checkColor)
            .setDescription(
              `${Config.emojis.checkEmoji} **Vous avez été inscrit avec succès à la catégorie \`${category}\`**`
            )

          // Update message
          const messageToUpdate = await interaction.channel.messages.fetch(
            messageID
          )
          await messageToUpdate.edit({
            content: `<@&1159104795173466184>`,
            embeds: [embedEventDisplay],
          })
          await interaction.reply({
            embeds: [embedAddedToParticipationList],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction "deleteChannel_"
    const [fromDeleteChannel, channelID] = interaction.customId.split("_")
    if (fromDeleteChannel === "deleteChannel") {
      try {
        // Vérifier si le salon existe
        const [channelExist] = await db
          .promise()
          .query(`SELECT * FROM channels WHERE channelID = ?`, [channelID])
        if (!channelExist.length) {
          const embedChannelNotFound = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setDescription(
              `⚠️ **Le salon avec l'identifiant \`${channelID}\` n'existe pas !**`
            )

          return interaction.reply({
            embeds: [embedChannelNotFound],
            ephemeral: true,
          })
        }

        // Supprimer le salon
        await db
          .promise()
          .query(`DELETE FROM channels WHERE channelID = ?`, [channelID])

        const embedChannelDeleted = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **Le salon avec l'identifiant \`${channelID}\` a été supprimé avec succès !**`
          )

        await interaction.update({
          embeds: [embedChannelDeleted],
          components: [],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction "startEntrylistRegistration"
    if (interaction.customId === "startEntrylistRegistration") {
      const embedSelectPlatform = new Discord.EmbedBuilder()
        .setColor(Config.colors.mainServerColor)
        .setDescription(
          `:warning: **Si vous êtes sur Playstation, merci de cliquer [ici](https://psn.flipscreen.games/) pour récupérer votre ID PSN**`
        )

      const actionSelectPlatform = new Discord.ActionRowBuilder().addComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId(`selectPlatform`)
          .setPlaceholder("📌 Sélectionner une platform...")
          .addOptions(
            {
              emoji: `${Config.emojis.playstationEmote}`,
              label: "Playstation",
              value: "P",
            },
            { emoji: `${Config.emojis.xboxEmote}`, label: "Xbox", value: "M" }
          )
      )

      await interaction.reply({
        embeds: [embedSelectPlatform],
        components: [actionSelectPlatform],
        ephemeral: true,
      })
    }

    async function updateDisplayedRequest(interaction, currentRequestIndex) {
      try {
        const [requestsList] = db
          .promise()
          .query(`SELECT * FROM requests WHERE requestStat = "waiting"`)
        const [countResult] = db
          .promise()
          .query(`SELECT COUNT(*) AS total FROM requests`)

        const totalRequests = countResult[0].total

        if (totalRequests === 0) {
          const noRequestsAvailable = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `${Config.emojis.crossEmoji} **Il n'y aucune demande pour l'instant !**`
            )

          return interaction.reply({
            embeds: [noRequestsAvailable],
            ephemeral: true,
          })
        } else {
          const currentRequest = requestsList[currentRequestIndex]

          const user = await bot.users.fetch(currentRequest.requestAuthorID)

          let checkPreviousRequestIndex, checkNextRequestIndex
          let checkCurrentRequestIndex = currentRequestIndex

          checkPreviousRequestIndex =
            currentRequestIndex === 0 &&
            checkCurrentRequestIndex + 1 === totalRequests
              ? true
              : currentRequestIndex === 0
              ? true
              : false

          checkNextRequestIndex =
            currentRequestIndex === 0 &&
            checkCurrentRequestIndex + 1 === totalRequests
              ? true
              : checkCurrentRequestIndex + 1 === totalRequests
              ? true
              : false

          let checkRequestStat =
            currentRequest.requestStat === "waiting"
              ? `⏳ En Attente...`
              : currentRequest.requestStat

          const [emote, platform] = currentRequest.requestPlatform

          const requestInformationEmbed = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(
              `### 📩 Demande Entrylist de ${
                user.globalName || user.username
              }\n\n- Utilisateur : ${user} (${
                user.globalName || user.username
              })\n- Identifiant : ${user.id}\n- ${emote} ${platform} : ${
                currentRequest.requestInGameUsername
              } (${
                currentRequest.requestPlatformID
              })\n- Demande : ${checkRequestStat}\n\n-# Demande : ${
                currentRequestIndex + 1
              } sur ${totalRequests}`
            )

          const actionRequestInformationSelecter =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.StringSelectMenuBuilder()
                .setCustomId(`selectRequestAction_${currentRequest.requestID}`)
                .setPlaceholder("📌 Sélectionner une option...")
                .addOptions(
                  {
                    emoji: "✅",
                    label: "Accepter",
                    description: `Accepter la demande de ${
                      user.globalName || user.username
                    }`,
                    value: "Accepted",
                  },
                  {
                    emoji: "⛔",
                    label: "Refuser",
                    description: `Refuser la demande de ${
                      user.globalName || user.username
                    }`,
                    value: "Refused",
                  }
                )
            )

          const actionRequestInformationButtons = new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`previousRequest_${currentRequestIndex}`)
                .setEmoji("◀️")
                .setDisabled(checkPreviousRequestIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )
            .addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`nextRequest_${currentRequestIndex}`)
                .setEmoji("▶")
                .setDisabled(checkNextRequestIndex)
                .setStyle(Discord.ButtonStyle.Secondary)
            )

          await interaction.reply({
            embeds: [requestInformationEmbed],
            components: [
              actionRequestInformationSelecter,
              actionRequestInformationButtons,
            ],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    const [fromDisplayRequest, requestIndex] = interaction.customId.split("_")
    if (
      fromDisplayRequest === "previousRequest" ||
      fromDisplayRequest === "nextRequest"
    ) {
      let currentRequestIndex = parseInt(requestIndex)

      currentRequestIndex =
        fromDisplayRequest === "previousRequest"
          ? currentRequestIndex - 1
          : fromDisplayRequest === "nextRequest"
          ? currentRequestIndex + 1
          : currentRequestIndex

      await updateDisplayedRequest(interaction, currentRequestIndex)
    }
  }

  /*************************************************************************************************************************/

  if (interaction.isStringSelectMenu()) {
    // Récupérer l'interaction "gestionAllBot_Interactions" celle qui va permettre de gérer plusieurs interaction du bot !
    if (interaction.customId === "gestionAllBot_Interactions") {
      if (interaction.values && interaction.values.length > 0) {
        let reqGestionChoice = interaction.values[0]

        // "0" faire juste un return
        if (reqGestionChoice === "0") {
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
                    label: "Demande d'Adhésion",
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

          await interaction.update({
            components: [interactionGestionOfAllBotInteractions],
          })
        }

        // "1" Est l'interaction pour ajouter un salon
        if (reqGestionChoice === "1") {
          const modalAddChannel = new Discord.ModalBuilder()
            .setCustomId(`modal_AddChannel`)
            .setTitle("Ajouter un salon")

          const modalChannelID = new Discord.TextInputBuilder()
            .setCustomId("modalChannelIDInput")
            .setLabel("Entrez l'identifiant du salon : ")
            .setPlaceholder("Exemple : 1277217143192289342")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const reqModalChannelIDInput =
            new Discord.ActionRowBuilder().addComponents(modalChannelID)

          modalAddChannel.addComponents(reqModalChannelIDInput)

          await interaction.showModal(modalAddChannel)
        }

        // "2" Est l'interaction pour gérer les salons
        if (reqGestionChoice === "2") {
          try {
            const [channels] = await db
              .promise()
              .query(`SELECT * FROM channels`)

            // Ajouter une vérification si il n'y a pas de salon
            if (!channels.length) {
              const embedNoChannelFound = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(
                  `⚠️ **Aucun salon n'a été trouvé dans la base de données !**`
                )

              return await interaction.reply({
                embeds: [embedNoChannelFound],
                ephemeral: true,
              })
            }

            // Créer une liste des channels
            let channelsOptions = []
            for (const channel of channels) {
              const channelInfo = await interaction.client.channels.fetch(
                channel.channelID
              )
              channelsOptions.push({
                label: `${channelInfo.name}`,
                value: `${channelInfo.id}`,
              })
            }

            const embedLetKnowUserToSelect = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `### 💬 Gestion des salons\n\nVous pouvez séléctionner un des salons disponible sur la liste en dessous !`
              )

            const interactionLetKnowUserToSelect =
              new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                  .setCustomId(`selectChannel_ToManage`)
                  .setPlaceholder("📌 Séléctionner un salon...")
                  .addOptions(channelsOptions)
              )

            await interaction.reply({
              embeds: [embedLetKnowUserToSelect],
              components: [interactionLetKnowUserToSelect],
              ephemeral: true,
            })
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détecté :")
              .setDescription(`\`\`\`${error}\`\`\``)
              .setTimestamp()

            const embedErrorDetected = new Discord.EmbedBuilder()
              .setColor(Config.colors.crossColor)
              .setDescription(
                "💥 **Une erreur a été détecté lors de votre interaction !**"
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

        // "3" Est l'interaction pour ajouter un preset
        if (reqGestionChoice === "3") {
          // Créer un modal pour récupérer les informations nécessaire à la création de la colonne.
          const modalPresetCreation = new Discord.ModalBuilder()
            .setCustomId(`modal_PresetCreation`)
            .setTitle("Ajouter un nouveau preset")

          const modalPresetName = new Discord.TextInputBuilder()
            .setCustomId("modalPresetNameInput")
            .setLabel("Entrez le nom du preset :")
            .setPlaceholder("Exemple : GT3")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalPresetCategory = new Discord.TextInputBuilder()
            .setCustomId(`modalPresetCategoryInput`)
            .setLabel("Entrez les catégories du preset :")
            .setPlaceholder("Exemple : GT3-20;GT4-20")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const reqModalPresetNameInput =
            new Discord.ActionRowBuilder().addComponents(modalPresetName)
          const reqModalPresetCategoryInput =
            new Discord.ActionRowBuilder().addComponents(modalPresetCategory)

          modalPresetCreation.addComponents(
            reqModalPresetNameInput,
            reqModalPresetCategoryInput
          )

          await interaction.showModal(modalPresetCreation)
        }

        // "4" Est l'interaction pour gérer les presets
        if (reqGestionChoice === "4") {
          try {
            const [presets] = await db.promise().query(`SELECT * FROM presets`)

            if (!presets.length) {
              const embedNoPresetsFound = new Discord.EmbedBuilder()
                .setColor("Yellow")
                .setDescription(
                  `⚠️ **Aucun preset n'a été trouvé dans la base de données !**`
                )

              return await interaction.reply({
                embeds: [embedNoPresetsFound],
                ephemeral: true,
              })
            }

            let presetsOptions = []
            presets.forEach((preset) => {
              presetsOptions.push({
                label: `${preset.presetName}`,
                value: `${preset.presetID}`,
              })
            })

            const embedLetKnowUserToSelect = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `### 🎛️ Gestion des presets\n\nVous pouvez sélectionner un des presets disponibles dans la liste ci-dessous !`
              )

            const interactionLetKnowUserToSelect =
              new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                  .setCustomId(`selectPresetToManage`)
                  .setPlaceholder("📌 Sélectionner un preset...")
                  .addOptions(presetsOptions)
              )

            await interaction.reply({
              embeds: [embedLetKnowUserToSelect],
              components: [interactionLetKnowUserToSelect],
              ephemeral: true,
            })
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détectée :")
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

        // "5" Est l'interaction pour ajouter des circuits
        if (reqGestionChoice === "5") {
          // Créer un modal pour récupérer les informations nécessaire à la création de la colonne.
          const modalTrackCreation = new Discord.ModalBuilder()
            .setCustomId(`modal_TrackCreation`)
            .setTitle("Ajouter un nouveau circuit")

          const modalTrackFlag = new Discord.TextInputBuilder()
            .setCustomId("modalTrackFlagInput")
            .setLabel("Entrez le drapeau du circuit :")
            .setPlaceholder("Exemple : 🇫🇷")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalTrackCountry = new Discord.TextInputBuilder()
            .setCustomId(`modalTrackCountryInput`)
            .setLabel("Entrez le pays du circuit :")
            .setPlaceholder("Exemple : France")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalTrackName = new Discord.TextInputBuilder()
            .setCustomId(`modalTrackNameInput`)
            .setLabel("Entrez le nom du circuit :")
            .setPlaceholder("Exemple : Paul Ricard")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalTrackLength = new Discord.TextInputBuilder()
            .setCustomId(`modalTrackLengthInput`)
            .setLabel("Entrez la longueur du circuit :")
            .setPlaceholder("Exemple : 5.810 KM")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalTrackImage = new Discord.TextInputBuilder()
            .setCustomId(`modalTrackImageInput`)
            .setLabel("Entrez une image du circuit (lien) :")
            .setPlaceholder(
              "Exemple : https://fr.wikipedia.org/Image/PaulRicard-Circuit"
            )
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Paragraph)

          const reqModalTrackFlagInput =
            new Discord.ActionRowBuilder().addComponents(modalTrackFlag)
          const reqModalTrackCountryInput =
            new Discord.ActionRowBuilder().addComponents(modalTrackCountry)
          const reqModalTrackNameInput =
            new Discord.ActionRowBuilder().addComponents(modalTrackName)
          const reqModalTrackLengthInput =
            new Discord.ActionRowBuilder().addComponents(modalTrackLength)
          const reqModalTrackImageInput =
            new Discord.ActionRowBuilder().addComponents(modalTrackImage)

          modalTrackCreation.addComponents(
            reqModalTrackFlagInput,
            reqModalTrackCountryInput,
            reqModalTrackNameInput,
            reqModalTrackLengthInput,
            reqModalTrackImageInput
          )

          await interaction.showModal(modalTrackCreation)
        }

        // "6" Est l'interaction pour gérer les circuits
        if (reqGestionChoice === "6") {
          try {
            // Récupérer toutes les informations de la table "tracks"
            const [trackList] = await db.promise().query(`SELECT * FROM tracks`)
            const [countResult] = await db
              .promise()
              .query(`SELECT COUNT(*) AS total FROM tracks`)

            let currentTrackIndex = 0

            const totalTracks = countResult[0].total

            // D'abord une condition pour vérifier si il n'y a pas de circuit
            if (totalTracks === 0) {
              const embedNoTracksAvailable = new Discord.EmbedBuilder()
                .setColor(Config.colors.crossColor)
                .setDescription(
                  `**${Config.emojis.crossEmoji} Aucun circuit n'a été ajouter !**`
                )

              return interaction.reply({
                embeds: [embedNoTracksAvailable],
                ephemeral: true,
              })
            } else {
              const currentTrack = trackList[currentTrackIndex]

              let checkTrackStatus,
                ButtonLabel,
                ButtonStyle,
                checkPreviousTrackIndex,
                checkNextTrackIndex
              let checkCurrentTrackIndex = currentTrackIndex

              // Faire des vérifications pour le début de la pagination
              if (
                currentTrackIndex === 0 &&
                checkCurrentTrackIndex + 1 === totalTracks
              ) {
                checkPreviousTrackIndex = true
                checkNextTrackIndex = true
              } else if (currentTrackIndex === 0) {
                checkPreviousTrackIndex = true
                checkNextTrackIndex = false
              } else if (checkCurrentTrackIndex + 1 === totalTracks) {
                checkPreviousTrackIndex = false
                checkNextTrackIndex = true
              } else {
                checkPreviousTrackIndex = false
                checkNextTrackIndex = false
              }

              // Le switch case va nous permettre de gérer les status des circuits
              switch (currentTrack.trackStat) {
                case "Activer":
                  checkTrackStatus = `🟢 Activé`
                  ButtonLabel = `Désactivé`
                  ButtonStyle = Discord.ButtonStyle.Danger
                  break

                case "Desactiver":
                  checkTrackStatus = `🔴 Désactivé`
                  ButtonLabel = `Activé`
                  ButtonStyle = Discord.ButtonStyle.Success
                  break
              }

              const user = await interaction.client.users.fetch(
                currentTrack.authorID
              )

              // Display à l'utilisateur les informations sur le circuit
              const embedTrackInformations = new Discord.EmbedBuilder()
                .setColor(Config.colors.mainServerColor)
                .setDescription(
                  `### ${currentTrack.trackFlag} ${currentTrack.trackName}, ${currentTrack.trackCountry}\n- Longueur du circuit : ${currentTrack.trackLength}\n- Status du circuit : **${checkTrackStatus}**\n- Auteur : ${user} (${user.username})\n- Identification : ${user.id}`
                )
                .setFooter({
                  text: `Circuit : ${currentTrackIndex + 1} sur ${totalTracks}`,
                })

              const interactionButtonTrackManagment =
                new Discord.ActionRowBuilder()
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`previousTrack_${currentTrackIndex}`)
                      .setEmoji("◀️")
                      .setDisabled(checkPreviousTrackIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`nextTrack_${currentTrackIndex}`)
                      .setEmoji("▶️")
                      .setDisabled(checkNextTrackIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`changeTrackStat_${currentTrack.trackID}`)
                      .setLabel(ButtonLabel)
                      .setDisabled(false)
                      .setStyle(ButtonStyle)
                  )

              await interaction.reply({
                embeds: [embedTrackInformations],
                components: [interactionButtonTrackManagment],
                ephemeral: true,
              })
            }
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détecté :")
              .setDescription(`\`\`\`${error}\`\`\``)
              .setTimestamp()

            const embedErrorDetected = new Discord.EmbedBuilder()
              .setColor(Config.colors.crossColor)
              .setDescription(
                "💥 **Une erreur a été détecté lors de votre interaction !**"
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

        // "7" Est l'interaction pour créer un nouvel événement
        if (reqGestionChoice === "7") {
          try {
            // Récupérer tout les circuits qui sont activé
            const [tracks] = await db
              .promise()
              .query(`SELECT * FROM tracks WHERE trackStat = ?`, ["Activer"])

            // Créer une liste de ces circuits pour les pushs dans un sélécteur !
            let tracksOptions = []
            tracks.forEach((track) => {
              tracksOptions.push({
                emoji: `${track.trackFlag}`,
                label: `${track.trackName} (${track.trackCountry})`,
                value: `${track.trackID}`,
              })
            })

            //  Embed de suivi pour l'utilisateur !
            const embedTrackingEventCreation = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `### ⏳ Création de l'évènement\n\n- Séléction du circuit : 🔴\n- Séléction du preset : 🔴\n- Sélection d'un channel : 🔴\n- Description Date & Heure : 🔴`
              )

            // Créer l'interaction pour faire une séléction
            const interactionTrackingEventCreation =
              new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                  .setCustomId(`select_track`)
                  .setPlaceholder("📌 Séléctionner le circuit de votre choix !")
                  .addOptions(tracksOptions)
              )

            await interaction.reply({
              embeds: [embedTrackingEventCreation],
              components: [interactionTrackingEventCreation],
              ephemeral: true,
            })
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détecté :")
              .setDescription(`\`\`\`${error}\`\`\``)
              .setTimestamp()

            const embedErrorDetected = new Discord.EmbedBuilder()
              .setColor(Config.colors.crossColor)
              .setDescription(
                "💥 **Une erreur a été détecté lors de votre interaction !**"
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

        // "8" Est l'interaction pour gérer les événements
        if (reqGestionChoice === "8") {
          try {
            // Récupérer toutes les informations de la table "tracks"
            const [eventList] = await db.promise().query(`SELECT * FROM events`)
            const [countResult] = await db
              .promise()
              .query(`SELECT COUNT(*) AS total FROM events`)

            let currentEventIndex = 0

            const totalEvents = countResult[0].total

            // D'abord une condition pour vérifier si il n'y a pas de circuit
            if (totalEvents === 0) {
              const embedNoEventAvailable = new Discord.EmbedBuilder()
                .setColor(Config.colors.crossColor)
                .setDescription(
                  `**${Config.emojis.crossEmoji} Aucun événement n'a été créer !**`
                )

              return interaction.reply({
                embeds: [embedNoEventAvailable],
                ephemeral: true,
              })
            } else {
              const currentEvent = eventList[currentEventIndex]

              const [tracks] = await db
                .promise()
                .query(`SELECT * FROM tracks WHERE trackID = ?`, [
                  currentEvent.eventTrackID,
                ])
              const track = tracks[0]

              let checkEventStatus,
                ButtonLabel,
                ButtonStyle,
                checkPreviousEventIndex,
                checkNextEventIndex
              let checkCurrentEventIndex = currentEventIndex

              // Faire des vérifications pour le début de la pagination
              if (
                currentEventIndex === 0 &&
                checkCurrentEventIndex + 1 === totalEvents
              ) {
                checkPreviousEventIndex = true
                checkNextEventIndex = true
              } else if (currentEventIndex === 0) {
                checkPreviousEventIndex = true
                checkNextEventIndex = false
              } else if (checkCurrentEventIndex + 1 === totalEvents) {
                checkPreviousEventIndex = false
                checkNextEventIndex = true
              } else {
                checkPreviousEventIndex = false
                checkNextEventIndex = false
              }

              // Le switch case va nous permettre de gérer les status des events
              switch (currentEvent.eventStat) {
                case "Ouvert":
                  checkEventStatus = `🟢 Inscription Ouvert`
                  ButtonLabel = `Fermer`
                  ButtonStyle = Discord.ButtonStyle.Danger
                  break

                case "Fermer":
                  checkEventStatus = `🔴 Inscription Fermé`
                  ButtonLabel = `Ouvert`
                  ButtonStyle = Discord.ButtonStyle.Success
                  break
              }

              const participations = currentEvent.eventParticipation.split(";")
              let participationLenght
              if (participations.length === 1) {
                participationLenght = "0"
              } else {
                participationLenght = participations.length - 1
              }

              // Afficher l'embed d'informations sur l'évènement
              const embedEventInformations = new Discord.EmbedBuilder()
                .setColor(Config.colors.mainServerColor)
                .setDescription(
                  `## 📅 Informations de l'évènement\n\n- Circuit : ${track.trackName}, ${track.trackCountry} (${track.trackFlag})\n- Preset ID : **${currentEvent.eventPresetID}**\n- Nombre de participant : ${participationLenght}\n- Status : **${checkEventStatus}**\n- Date & Heure : <t:${currentEvent.eventTimestamp}:D> (**<t:${currentEvent.eventTimestamp}:R>**)`
                )
                .setFooter({
                  text: `Évènement : ${
                    currentEventIndex + 1
                  } sur ${totalEvents}`,
                })

              const interactionButtonEventManagment =
                new Discord.ActionRowBuilder()
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`previousEvent_${currentEventIndex}`)
                      .setEmoji("◀️")
                      .setDisabled(checkPreviousEventIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`nextEvent_${currentEventIndex}`)
                      .setEmoji("▶️")
                      .setDisabled(checkNextEventIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`changeEventStat_${currentEvent.eventID}`)
                      .setLabel(ButtonLabel)
                      .setDisabled(false)
                      .setStyle(ButtonStyle)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`deleteEvent_${currentEvent.eventID}`)
                      .setEmoji("🗑️")
                      .setLabel("Supprimer")
                      .setDisabled(false)
                      .setStyle(Discord.ButtonStyle.Primary)
                  )

              await interaction.reply({
                embeds: [embedEventInformations],
                components: [interactionButtonEventManagment],
                ephemeral: true,
              })
            }
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détecté :")
              .setDescription(`\`\`\`${error}\`\`\``)
              .setTimestamp()

            const embedErrorDetected = new Discord.EmbedBuilder()
              .setColor(Config.colors.crossColor)
              .setDescription(
                "💥 **Une erreur a été détecté lors de votre interaction !**"
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

        // "9" Est l'interaction pour modifier le règlement avec un modal
        if (reqGestionChoice === "9") {
          const modalRulesUpdate = new Discord.ModalBuilder()
            .setCustomId(`modal_RulesUpdate`)
            .setTitle("Modifier le règlement")

          const modalRulesInput = new Discord.TextInputBuilder()
            .setCustomId("modalRulesInput")
            .setLabel("Entrez le nouveau règlement :")
            .setPlaceholder("Exemple : Règlement de course...")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Paragraph)

          const reqModalRulesInput =
            new Discord.ActionRowBuilder().addComponents(modalRulesInput)

          modalRulesUpdate.addComponents(reqModalRulesInput)

          await interaction.showModal(modalRulesUpdate)
        }

        // "10" Est l'interaction pour afficher une pagination de la liste d'adhésion
        if (reqGestionChoice === "10") {
          try {
            const [requestsList] = db
              .promise()
              .query(`SELECT * FROM requests WHERE requestStat = "waiting"`)
            const [countResult] = db
              .promise()
              .query(`SELECT COUNT(*) AS total FROM requests`)

            let currentRequestIndex = 0
            const totalRequests = countResult[0].total

            if (totalRequests === 0) {
              const noRequestsAvailable = new Discord.EmbedBuilder()
                .setColor(Config.colors.crossColor)
                .setDescription(
                  `${Config.emojis.crossEmoji} **Il n'y aucune demande pour l'instant !**`
                )

              return interaction.reply({
                embeds: [noRequestsAvailable],
                ephemeral: true,
              })
            } else {
              const currentRequest = requestsList[currentRequestIndex]

              const user = await bot.users.fetch(currentRequest.requestAuthorID)

              let checkPreviousRequestIndex, checkNextRequestIndex
              let checkCurrentRequestIndex = currentRequestIndex

              checkPreviousRequestIndex =
                currentRequestIndex === 0 &&
                checkCurrentRequestIndex + 1 === totalRequests
                  ? true
                  : currentRequestIndex === 0
                  ? true
                  : false

              checkNextRequestIndex =
                currentRequestIndex === 0 &&
                checkCurrentRequestIndex + 1 === totalRequests
                  ? true
                  : checkCurrentRequestIndex + 1 === totalRequests
                  ? true
                  : false

              let checkRequestStat =
                currentRequest.requestStat === "waiting"
                  ? `⏳ En Attente...`
                  : currentRequest.requestStat

              const [emote, platform] = currentRequest.requestPlatform

              const requestInformationEmbed = new Discord.EmbedBuilder()
                .setColor(Config.colors.mainServerColor)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                  `### 📩 Demande Entrylist de ${
                    user.globalName || user.username
                  }\n\n- Utilisateur : ${user} (${
                    user.globalName || user.username
                  })\n- Identifiant : ${user.id}\n- ${emote} ${platform} : ${
                    currentRequest.requestInGameUsername
                  } (${
                    currentRequest.requestPlatformID
                  })\n- Demande : ${checkRequestStat}\n\n-# Demande : ${
                    currentRequestIndex + 1
                  } sur ${totalRequests}`
                )

              const actionRequestInformationSelecter =
                new Discord.ActionRowBuilder().addComponents(
                  new Discord.StringSelectMenuBuilder()
                    .setCustomId(
                      `selectRequestAction_${currentRequest.requestID}`
                    )
                    .setPlaceholder("📌 Sélectionner une option...")
                    .addOptions(
                      {
                        emoji: "✅",
                        label: "Accepter",
                        description: `Accepter la demande de ${
                          user.globalName || user.username
                        }`,
                        value: "Accepted",
                      },
                      {
                        emoji: "⛔",
                        label: "Refuser",
                        description: `Refuser la demande de ${
                          user.globalName || user.username
                        }`,
                        value: "Refused",
                      }
                    )
                )

              const actionRequestInformationButtons =
                new Discord.ActionRowBuilder()
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`previousRequest_${currentRequestIndex}`)
                      .setEmoji("◀️")
                      .setDisabled(checkPreviousRequestIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )
                  .addComponents(
                    new Discord.ButtonBuilder()
                      .setCustomId(`nextRequest_${currentRequestIndex}`)
                      .setEmoji("▶")
                      .setDisabled(checkNextRequestIndex)
                      .setStyle(Discord.ButtonStyle.Secondary)
                  )

              await interaction.reply({
                embeds: [requestInformationEmbed],
                components: [
                  actionRequestInformationSelecter,
                  actionRequestInformationButtons,
                ],
                ephemeral: true,
              })
            }
          } catch (error) {
            errorHandler(Discord, bot, interaction, Config, error)
          }
        }
      }
    }

    const [fromDisplayRequest, userId] = interaction.customId.split("_")
    if (fromDisplayRequest === "selectRequestAction") {
      if (interaction.values && interaction.values.length > 0) {
        let reqActionChoice = interaction.values[0]

        try {
          const user = await bot.users.fetch(userId)

          let checkColor =
            reqActionChoice === "Accepted"
              ? `${Config.colors.checkColor}`
              : `${Config.colors.crossColor}`

          let checkChoice =
            reqActionChoice === "Accepted" ? `accepter` : `refuser`

          const sendEmbedToUser = new Discord.EmbedBuilder()
            .setColor(checkColor)
            .setDescription(
              `**Vous avez été ${checkChoice} de l'entrylist ${interaction.guild.name}**`
            )

          const interactionReplyEmbed = new Discord.EmbedBuilder()
            .setColor(Config.colors.checkColor)
            .setDescription(
              `${Config.emojis.checkEmoji} **Utilisateur ${checkChoice} avec succès !**`
            )

          await user.send({ embeds: [sendEmbedToUser] })
          await interaction.reply({
            embeds: [interactionReplyEmbed],
            ephemeral: true,
          })
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    // Récupérer l'interaction "selectPreset_ToManage"
    if (interaction.customId === "selectPresetToManage") {
      if (interaction.values && interaction.values.length > 0) {
        let reqPresetID = interaction.values[0]

        try {
          const [presets] = await db
            .promise()
            .query(`SELECT * FROM presets WHERE presetID = ?`, [reqPresetID])
          const preset = presets[0]

          const embedChannelInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### 🔎 Informations du Preset\n\n- Nom du Preset : ${preset.presetName}\n`
            )

          const interactionButtonChannelManagment =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`deletePreset_${preset.presetID}`)
                .setEmoji("🗑️")
                .setLabel("Supprimer")
                .setDisabled(false)
                .setStyle(Discord.ButtonStyle.Danger)
            )

          await interaction.update({
            embeds: [embedChannelInformations],
            components: [interactionButtonChannelManagment],
            ephemeral: true,
          })
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    // Récupérer l'interaction "selectChannel_ToManage"
    if (interaction.customId === "selectChannel_ToManage") {
      if (interaction.values && interaction.values.length > 0) {
        let reqChannelID = interaction.values[0]

        try {
          const [channels] = await db
            .promise()
            .query(`SELECT * FROM channels WHERE channelID = ?`, [reqChannelID])
          const channel = channels[0]

          const channelInfo = await interaction.client.channels.fetch(
            channel.channelID
          )

          const embedChannelInformations = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### 🔎 Informations du salon\n\n- Nom du salon : ${channelInfo.name}\n- Identifiant du salon : ${channelInfo.id}\n- Type du salon : ${channelInfo.type}\n- Création du salon : <t:${channelInfo.createdTimestamp}:R>`
            )

          const interactionButtonChannelManagment =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(`deleteChannel_${channel.channelID}`)
                .setEmoji("🗑️")
                .setLabel("Supprimer")
                .setDisabled(false)
                .setStyle(Discord.ButtonStyle.Danger)
            )

          await interaction.update({
            embeds: [embedChannelInformations],
            components: [interactionButtonChannelManagment],
            ephemeral: true,
          })
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    // Récupérer l'interaction "select_track"
    if (interaction.customId === "select_track") {
      if (interaction.values && interaction.values.length > 0) {
        let reqTrackID = interaction.values[0]

        try {
          const eventID = generateID()

          // Insérer dans la table events le nouvelle évènement
          await db
            .promise()
            .query(
              `INSERT INTO events (eventID, eventTrackID, eventPresetID, eventDescription, eventParticipation, eventTimestamp, eventMessageID, eventChannelID, eventStat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                eventID,
                reqTrackID,
                "None",
                "None",
                "",
                "None",
                "None",
                "None",
                "Ouvert",
              ]
            )

          // Récupérer tout les presets
          const [presets] = await db.promise().query(`SELECT * FROM presets`)

          // Créer une liste de ces circuits pour les pushs dans un sélécteur !
          let presetsOptions = []
          presets.forEach((preset) => {
            presetsOptions.push({
              label: `${preset.presetName} (${preset.presetCategory})`,
              value: `${preset.presetID}`,
            })
          })

          //  Embed de suivi pour l'utilisateur !
          const embedTrackingEventCreation = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### ⏳ Création de l'évènement\n\n- Séléction du circuit : 🟢\n- Séléction du preset : 🔴\n- Sélection d'un channel : 🔴\n- Description Date & Heure : 🔴`
            )

          // Créer l'interaction pour faire une séléction
          const interactionTrackingEventCreation =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.StringSelectMenuBuilder()
                .setCustomId(`selectPreset_${eventID}`)
                .setPlaceholder("📌 Séléctionner le preset de votre choix !")
                .addOptions(presetsOptions)
            )

          await interaction.update({
            embeds: [embedTrackingEventCreation],
            components: [interactionTrackingEventCreation],
            ephemeral: true,
          })
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    const [fromSelectTrack, eventId] = interaction.customId.split("_")
    if (fromSelectTrack === "selectPreset") {
      if (interaction.values && interaction.values.length > 0) {
        let reqPresetID = interaction.values[0]

        try {
          // Mettre à jour la colonne presetID
          await db
            .promise()
            .query(`UPDATE events SET eventPresetID = ? WHERE eventID = ?`, [
              reqPresetID,
              eventId,
            ])

          // Récupérer tout les presets
          const [channels] = await db.promise().query(`SELECT * FROM channels`)

          let channelsOptions = []
          for (const channel of channels) {
            const channelInfo = await interaction.client.channels.fetch(
              channel.channelID
            )
            channelsOptions.push({
              label: `${channelInfo.name}`,
              value: `${channelInfo.id}`,
            })
          }

          //  Embed de suivi pour l'utilisateur !
          const embedTrackingEventCreation = new Discord.EmbedBuilder()
            .setColor(Config.colors.mainServerColor)
            .setDescription(
              `### ⏳ Création de l'évènement\n\n- Séléction du circuit : 🟢\n- Séléction du preset : 🟢\n- Sélection d'un channel : 🔴\n- Description Date & Heure : 🔴`
            )

          // Créer l'interaction pour faire une séléction
          const interactionTrackingEventCreation =
            new Discord.ActionRowBuilder().addComponents(
              new Discord.StringSelectMenuBuilder()
                .setCustomId(`selectChannel_${eventId}`)
                .setPlaceholder("📌 Séléctionner le preset de votre choix !")
                .addOptions(channelsOptions)
            )

          await interaction.update({
            embeds: [embedTrackingEventCreation],
            components: [interactionTrackingEventCreation],
            ephemeral: true,
          })
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    // Récupérer L'interaction "selectChannel" pour la suite des interactions
    const [fromSelectPreset, eventIds] = interaction.customId.split("_")
    if (fromSelectPreset === "selectChannel") {
      if (interaction.values && interaction.values.length > 0) {
        let reqchannelID = interaction.values[0]

        try {
          // Mettre à jour la colonne presetID
          await db
            .promise()
            .query(`UPDATE events SET eventChannelID = ? WHERE eventID = ?`, [
              reqchannelID,
              eventIds,
            ])

          // Créer un modal pour récupérer les informations nécessaire à la création d'un évènement.
          const modalEventCreation = new Discord.ModalBuilder()
            .setCustomId(`modalEventCreation_${eventIds}`)
            .setTitle("Nouvelle Évènement")

          const modalEventDescription = new Discord.TextInputBuilder()
            .setCustomId("modalEventDescriptionInput")
            .setLabel("Entrez la description de l'event :")
            .setPlaceholder("Exemple : description etc...")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Paragraph)

          const modalEventDate = new Discord.TextInputBuilder()
            .setCustomId(`modalEventDateInput`)
            .setLabel("Entrez la date de votre event :")
            .setPlaceholder("Exemple : 13/12/2024 (JJ/MM/AAAA)")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const modalEventHour = new Discord.TextInputBuilder()
            .setCustomId(`modalEventHourInput`)
            .setLabel("Entrez l'heure de votre l'event :")
            .setPlaceholder("Exemple : 21:30 (HH:mm)")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const reqModalEventDescriptionInput =
            new Discord.ActionRowBuilder().addComponents(modalEventDescription)
          const reqModalEventDateInput =
            new Discord.ActionRowBuilder().addComponents(modalEventDate)
          const reqModalEventHourInput =
            new Discord.ActionRowBuilder().addComponents(modalEventHour)

          modalEventCreation.addComponents(
            reqModalEventDescriptionInput,
            reqModalEventDateInput,
            reqModalEventHourInput
          )

          await interaction.showModal(modalEventCreation)
        } catch (error) {
          errorHandler(Discord, bot, interaction, Config, error)
        }
      }
    }

    // Récupérer l'interaction pour valider ou pas la création d'un event
    const [fromModalEventCreation, eventsID] = interaction.customId.split("_")
    if (fromModalEventCreation === "validateEventCreation") {
      if (interaction.values && interaction.values.length > 0) {
        let reqChoiceEvent = interaction.values[0]

        // Créer une condition pour envoyer et valider l'évènement ou bien le supprimer de la base de données
        if (reqChoiceEvent === "1") {
          try {
            // Récupérer l'évènement que nous avons créer
            const [events] = await db
              .promise()
              .query(`SELECT * FROM events WHERE eventID = ?`, [eventsID])
            const event = events[0]

            // Récupérer les informations nécessaire comme le circuit ou les presets !
            const [tracks] = await db
              .promise()
              .query(`SELECT * FROM tracks WHERE trackID = ?`, [
                event.eventTrackID,
              ])
            const track = tracks[0]

            const [presets] = await db
              .promise()
              .query(`SELECT * FROM presets WHERE presetID = ?`, [
                event.eventPresetID,
              ])
            const preset = presets[0]

            // Étape 1 : Diviser les catégories en fonction de ";"
            const categoryEntries = preset.presetCategory
              .split(";")
              .filter((entry) => entry) // Filtrer pour éviter les chaînes vides

            // Étape 2 : Parcourir et extraire les données
            const categories = categoryEntries.map((entry) => {
              const [category, maxParticipants] = entry.split("-") // Diviser la catégorie et le nombre d'utilisateur max
              return {
                category,
                maxParticipants: parseInt(maxParticipants, 10),
              } // Retourner un objet avec les deux
            })

            // Récupérer la liste des participants
            const participations = event.eventParticipation.split(";")

            // Créer l'embed d'évènement
            const embedEventDisplay = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setDescription(
                `## ${track.trackFlag} ${track.trackName} (${track.trackLength})\n\n${event.eventDescription}\n\n- **📅 Date :** <t:${event.eventTimestamp}:D>\n- **⏰ Horaire :** <t:${event.eventTimestamp}:t>\n- **📍 Lieu :** ${track.trackName}, ${track.trackCountry}`
              )
              .setImage(track.trackImage)

            // Parcourir chaque catégorie
            for (const { category, maxParticipants } of categories) {
              // Filtrer les utilisateurs correspondant à la catégorie
              const usersID = participations
                .filter((participation) =>
                  participation.startsWith(`${category}-`)
                )
                .map((participation) => participation.split("-")[1]) // Filtrer par catégorie et récupérer uniquement l'ID de l'utilisateur

              // Récupérer les utilisateurs depuis leurs ID
              const users = await Promise.all(
                usersID.map((userID) =>
                  interaction.client.users.fetch(userID).catch(() => null)
                )
              ) // Récupérer les utilisateurs

              // Créer la liste des noms d'utilisateurs ou afficher "Aucun participant"
              const userList = users
                .filter((user) => user)
                .map((user) => `> ${user.username}`)
                .join("\n")

              embedEventDisplay.addFields({
                name: `Catégorie ${category} (${users.length}/${maxParticipants})`,
                value: userList || "> Aucun Participant",
                inline: true,
              })
            }

            // Liste des styles de boutons disponible
            const buttonStyles = [
              Discord.ButtonStyle.Primary,
              Discord.ButtonStyle.Secondary,
              Discord.ButtonStyle.Success,
            ]

            // Créer une fonction pour séléctionner un style aléatoirement
            function getRandomButtonStyle() {
              return buttonStyles[
                Math.floor(Math.random() * buttonStyles.length)
              ]
            }

            // Créer les boutons dynamiques pour chaque catégorie
            const buttons = categories.map(
              ({ category }, index) =>
                new Discord.ButtonBuilder()
                  .setCustomId(`registerParticipation_${category}`)
                  .setLabel(category)
                  .setStyle(getRandomButtonStyle()) // Style aléatoire
            )

            // Ajouter les boutons dans une ou plusieurs ActionRow
            const actionRows = []
            for (let i = 0; i < buttons.length; i += 5) {
              actionRows.push(
                new Discord.ActionRowBuilder().addComponents(
                  buttons.slice(i, i + 5)
                )
              ) // Maximum 5 boutons par ActionRow
            }

            // Envoyer le message

            const sendMessageEvent = await bot.channels.cache
              .get(event.eventChannelID)
              .send({
                content: `<@&1159104795173466184>`,
                embeds: [embedEventDisplay],
                components: actionRows,
              })

            // Récupérer l'id du message et l'ajouter dans la base de données !
            const messageID = sendMessageEvent.id
            await db
              .promise()
              .query(`UPDATE events SET eventMessageID = ? WHERE eventID = ?`, [
                messageID,
                eventsID,
              ])

            // Embed Confirmant l'envoi et la disponibilité de l'évènement !
            const embedEventCreatedSuccessfully = new Discord.EmbedBuilder()
              .setColor(Config.colors.checkColor)
              .setDescription(
                `**${Config.emojis.checkEmoji} Évènement créer avec succès ! 🎉**`
              )

            await interaction.update({
              embeds: [embedEventCreatedSuccessfully],
              components: [],
              ephemeral: true,
            })
          } catch (error) {
            const embedErrorDetectionLog = new Discord.EmbedBuilder()
              .setColor(Config.colors.mainServerColor)
              .setTitle("📌 Erreur Détecté :")
              .setDescription(`\`\`\`${error}\`\`\``)
              .setTimestamp()

            const embedErrorDetected = new Discord.EmbedBuilder()
              .setColor(Config.colors.crossColor)
              .setDescription(
                "💥 **Une erreur a été détecté lors de votre interaction !**"
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
        } else {
          // Si l'utilisateur refuse alors supprimé l'événement
          await db
            .promise()
            .query(`DELETE FROM events WHERE eventID = ?`, [eventsID])

          const embedDeniedEvent = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `${Config.emojis.checkEmoji} **Événement supprimé avec succès !**`
            )

          return interaction.reply({
            embeds: [embedDeniedEvent],
            ephemeral: true,
          })
        }
      }
    }

    // Récupérer l'interaction pour continuer sur le fomulaire d'entrylist "selectPlatform"
    if (interaction.customId === "selectPlatform") {
      if (interaction.values && interaction.values.length > 0) {
        let reqPlatformChoice = interaction.values[0]

        if (reqPlatformChoice === "P") {
          // INTERACTION POUR PLAYSTATION
          const formEntrylist = new Discord.ModalBuilder()
            .setCustomId(`modalFormEntrylistPlay_${reqPlatformChoice}`)
            .setTitle("Entrylist LSX")

          const pseudoFormInput = new Discord.TextInputBuilder()
            .setCustomId(`modalPseudoInput`)
            .setLabel("Veuillez entrer votre PSN :")
            .setPlaceholder("Exemple : PossoRL0943")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const platformIDFormInput = new Discord.TextInputBuilder()
            .setCustomId(`modalPlatformIDInput`)
            .setLabel("Veuillez entrer votre ID PSN :")
            .setPlaceholder("Exemple : 984589385928443")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const numberFormInput = new Discord.TextInputBuilder()
            .setCustomId(`modalNumberInput`)
            .setLabel("Veuillez entrer un numéro :")
            .setPlaceholder("Exemple : 657")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const reqPseudoFormInput =
            new Discord.ActionRowBuilder().addComponents(pseudoFormInput)
          const reqPlatformIDInput =
            new Discord.ActionRowBuilder().addComponents(platformIDFormInput)
          const reqNumberFormInput =
            new Discord.ActionRowBuilder().addComponents(numberFormInput)

          formEntrylist.addComponents(
            reqPseudoFormInput,
            reqPlatformIDInput,
            reqNumberFormInput
          )

          await interaction.showModal(formEntrylist)
        }

        if (reqPlatformChoice === "M") {
          const formEntrylist = new Discord.ModalBuilder()
            .setCustomId(`modalFormEntrylistXbox_${reqPlatformChoice}`)
            .setTitle("Entrylist LSX")

          const pseudoFormInput = new Discord.TextInputBuilder()
            .setCustomId(`modalPseudoInput`)
            .setLabel("Veuillez entrer votre Gamertag :")
            .setPlaceholder("Exemple : PossoRL0943")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const numberFormInput = new Discord.TextInputBuilder()
            .setCustomId(`modalNumberInput`)
            .setLabel("Veuillez entrer un numéro :")
            .setPlaceholder("Exemple : 657")
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

          const reqPseudoFormInput =
            new Discord.ActionRowBuilder().addComponents(pseudoFormInput)
          const reqNumberFormInput =
            new Discord.ActionRowBuilder().addComponents(numberFormInput)

          formEntrylist.addComponents(reqPseudoFormInput, reqNumberFormInput)

          await interaction.showModal(formEntrylist)
        }
      }
    }
  }

  /*************************************************************************************************************************/

  if (interaction.isModalSubmit()) {
    const [fromSelectPlatformPlay, PlatformChoicePlay] =
      interaction.customId.split("_")
    if (fromSelectPlatformPlay === "modalFormEntrylistPlay") {
      const reqPseudocontent =
        interaction.fields.getTextInputValue("modalPseudoInput")
      const reqNumberContent =
        interaction.fields.getTextInputValue("modalNumberInput")

      const reqPlatformIDContent = interaction.fields.getTextInputValue(
        "modalPlatformIDInput"
      )

      try {
        const [row] = await db
          .promise()
          .query(`SELECT * FROM users WHERE inGameNumber = ${reqNumberContent}`)

        if (reqNumberContent === row[0].inGameNumber) {
          const embedNumberExist = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `${Config.emojis.crossEmoji} **Ce numéro est déjà pris ! Merci de refaire votre demande avec un numéro valide !**`
            )

          return interaction.reply({
            embeds: [embedNumberExist],
            ephemeral: true,
          })
        } else {
          let requestID = generateID()
          let platformID = `${PlatformChoicePlay}${reqPlatformIDContent}`
          let platform = `${Config.emojis.playstationEmote} Playstation`

          await db
            .promise()
            .query(
              `INSERT INTO requests (requestID, requestAuthorID, requestInGameUsername, requestInGameNumber, requestPlatformID, requestPlatform, requestStat) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                requestID,
                interaction.user.id,
                reqPseudocontent,
                reqNumberContent,
                platformID,
                platform,
                "waiting",
              ]
            )

          const embedRequestSuccess = new Discord.EmbedBuilder()
            .setColor(Config.colors.checkColor)
            .setDescription(
              `${Config.emojis.checkEmoji} **Votre demande à bien été enregistrer !**`
            )

          await interaction.update({
            embeds: [embedRequestSuccess],
            components: [],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    const [fromSelectPlatformXbox, PlatformChoiceXbox] =
      interaction.customId.split("_")
    if (fromSelectPlatformXbox === "modalFormEntrylistXbox") {
      const reqPseudocontent =
        interaction.fields.getTextInputValue("modalPseudoInput")
      const reqNumberContent =
        interaction.fields.getTextInputValue("modalNumberInput")

      try {
        const [row] = await db
          .promise()
          .query(`SELECT * FROM users WHERE inGameNumber = ${reqNumberContent}`)

        if (row.length > 0) {
          const embedNumberExist = new Discord.EmbedBuilder()
            .setColor(Config.colors.crossColor)
            .setDescription(
              `${Config.emojis.crossEmoji} **Ce numéro est déjà pris ! Merci de refaire votre demande avec un numéro valide !**`
            )

          return interaction.reply({
            embeds: [embedNumberExist],
            ephemeral: true,
          })
        } else {
          let requestID = generateID()
          let generateXboxID = await getXboxId(
            axios,
            reqPseudocontent,
            process.env.XBOX_APIKEY
          )
          let completPlatformID = `${PlatformChoiceXbox}${generateXboxID}`
          let platform = `${Config.emojis.xboxEmote} Xbox`

          await db
            .promise()
            .query(
              `INSERT INTO requests (requestID, requestAuthorID, requestInGameUsername, requestInGameNumber, requestPlatformID, requestPlatform, requestStat) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                requestID,
                interaction.user.id,
                reqPseudocontent,
                reqNumberContent,
                completPlatformID,
                platform,
                "waiting",
              ]
            )

          const embedRequestSuccess = new Discord.EmbedBuilder()
            .setColor(Config.colors.checkColor)
            .setDescription(
              `${Config.emojis.checkEmoji} **Votre demande à bien été enregistrer !**`
            )

          await interaction.update({
            embeds: [embedRequestSuccess],
            components: [],
            ephemeral: true,
          })
        }
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    if (interaction.customId === "modal_TrackCreation") {
      const reqTrackFlagContent = interaction.fields.getTextInputValue(
        "modalTrackFlagInput"
      )
      const reqTrackCountryContent = interaction.fields.getTextInputValue(
        "modalTrackCountryInput"
      )
      const reqTrackNameContent = interaction.fields.getTextInputValue(
        "modalTrackNameInput"
      )
      const reqTrackLengthContent = interaction.fields.getTextInputValue(
        "modalTrackLengthInput"
      )
      const reqTrackImageContent = interaction.fields.getTextInputValue(
        "modalTrackImageInput"
      )

      try {
        // Générer un ID pour inseret le circuit dans la base de données
        const trackID = generateID()

        // Insérer les données récolter dans la base de données
        await db
          .promise()
          .query(
            `INSERT INTO tracks (trackID, authorID, trackFlag, trackCountry, trackName, trackLength, trackImage, trackGameID, trackStat) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              trackID,
              interaction.user.id,
              reqTrackFlagContent,
              reqTrackCountryContent,
              reqTrackNameContent,
              reqTrackLengthContent,
              reqTrackImageContent,
              " ",
              "Activer",
            ]
          )

        // Embed signalant à l'utilisateur que le circuit a été ajouter avec succès
        const embedAddedNewRaceTrackSuccessfully = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `**${Config.emojis.checkEmoji} Ajout du circuit avec succès !**`
          )

        // Embed de log qui permettera de savoir qui a ajouter les différents circuits
        const embedLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle(`Ajout d'un circuit ${reqTrackNameContent}`)
          .setDescription(
            `- Auteur : ${interaction.user} (*${interaction.user.username}*)\n- Identifiant : **${interaction.user.id}**\n- Identifiant Circuit : \`**${trackID}**\``
          )
          .setTimestamp()

        await interaction.reply({
          embeds: [embedAddedNewRaceTrackSuccessfully],
          ephemeral: true,
        })
        await bot.channels.cache
          .get(Config.channels.logsChannel)
          .send({ embeds: [embedLog] })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    if (interaction.customId === "modal_AddChannel") {
      const reqchannelIDContent = interaction.fields.getTextInputValue(
        "modalChannelIDInput"
      )

      await db
        .promise()
        .query(`INSERT INTO channels (channelID) VALUES (?)`, [
          reqchannelIDContent,
        ])

      const embedChannelAddedSuccessfully = new Discord.EmbedBuilder()
        .setColor(Config.colors.checkColor)
        .setDescription(
          `${Config.emojis.checkEmoji} **Salon ajouté à la base de données avec succès !**`
        )

      await interaction.reply({
        embeds: [embedChannelAddedSuccessfully],
        ephemeral: true,
      })
    }

    // Récupérer la suite d'interaction de la création de l'évènement
    const [fromSelectPreset, eventId] = interaction.customId.split("_")
    if (fromSelectPreset === "modalEventCreation") {
      const reqEventDescriptionContent = interaction.fields.getTextInputValue(
        "modalEventDescriptionInput"
      )
      const reqEventDateContent = interaction.fields.getTextInputValue(
        "modalEventDateInput"
      )
      const reqEventHourContent = interaction.fields.getTextInputValue(
        "modalEventHourInput"
      )

      try {
        // Transformer "reqEventDateContent" et "reqEventHourContent" en TIMESTAMP
        const dateInput = reqEventDateContent
        const timeInput = reqEventHourContent

        // Séparer les composants de la date
        const [day, month, year] = dateInput.split("/").map(Number)

        // Séparer les composants de l'heure
        const [hours, minutes] = timeInput.split(":").map(Number)

        // Créer un timestamp en UTC
        const timestamp = Math.floor(
          Date.UTC(year, month - 1, day, hours - 1, minutes) / 1000
        )

        //  Embed de suivi pour l'utilisateur !
        const embedTrackingEventCreation = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setDescription(
            `### ⏳ Création de l'évènement\n\n- Séléction du circuit : 🟢\n- Séléction du preset : 🟢\n- Sélection d'un channel : 🟢\n- Description Date & Heure : 🟢\n\n**Voulez-vous valider la création ou pas ?**`
          )

        const interactionTrackingEventCreation =
          new Discord.ActionRowBuilder().addComponents(
            new Discord.StringSelectMenuBuilder()
              .setCustomId(`validateEventCreation_${eventId}`)
              .setPlaceholder("📌 Séléctionner l'option de votre choix")
              .addOptions(
                { emoji: `✅`, label: `Valider`, value: `1` },
                { emoji: `❌`, label: `Supprimer`, value: `2` }
              )
          )

        // Mettre à jour toutes les colonnes restantes
        await db
          .promise()
          .query(
            `UPDATE events SET eventDescription = ?, eventTimestamp = ? WHERE eventID = ?`,
            [reqEventDescriptionContent, timestamp, eventId]
          )

        await interaction.update({
          embeds: [embedTrackingEventCreation],
          components: [interactionTrackingEventCreation],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction pour la création d'un preset
    if (interaction.customId === "modal_PresetCreation") {
      const reqPresetNameContent = interaction.fields.getTextInputValue(
        "modalPresetNameInput"
      )
      const reqPresetCategoryContent = interaction.fields.getTextInputValue(
        "modalPresetCategoryInput"
      )

      try {
        // Générer un ID pour inseret le circuit dans la base de données
        const presetID = generateID()

        // Insérer les données récolter dans la base de données
        await db
          .promise()
          .query(
            `INSERT INTO presets (presetID, presetName, presetCategory) VALUES(?, ?, ?)`,
            [presetID, reqPresetNameContent, reqPresetCategoryContent]
          )

        // Embed signalant à l'utilisateur que le circuit a été ajouter avec succès
        const embedAddedNewPresetSuccessfully = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `**${Config.emojis.checkEmoji} Ajout du preset avec succès !**`
          )

        // Embed de log qui permettera de savoir qui a ajouter les différents circuits
        const embedLog = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setTitle(`Ajout d'un preset ${reqPresetNameContent}`)
          .setDescription(
            `- Auteur : ${interaction.user} (*${interaction.user.username}*)\n- Identifiant : **${interaction.user.id}**\n- Identifiant Preset : \`**${presetID}**\``
          )
          .setTimestamp()

        await interaction.reply({
          embeds: [embedAddedNewPresetSuccessfully],
          ephemeral: true,
        })
        await bot.channels.cache
          .get(Config.channels.logsChannel)
          .send({ embeds: [embedLog] })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction "modal_RulesUpdate" pour modifier le règlement dans la base de données
    if (interaction.customId === "modal_RulesUpdate") {
      const reqRulesContent =
        interaction.fields.getTextInputValue("modalRulesInput")

      try {
        await db
          .promise()
          .query(
            `UPDATE settings SET guildRules = ?, guildAuthorID = ? WHERE guildID = ?`,
            [reqRulesContent, interaction.user.id, interaction.guild.id]
          )

        const embedRulesUpdatedSuccessfully = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **Règlement mis à jour avec succès !**`
          )

        await interaction.reply({
          embeds: [embedRulesUpdatedSuccessfully],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }

    // Récupérer l'interaction "sendSanction" pour l'envoi d'une sanction via le bot
    const [fromSendingSanction, userId] = interaction.customId.split("_")
    if (fromSendingSanction === "sendSanction") {
      const user = await interaction.client.users.fetch(userId)
      const reqMessageContent =
        interaction.fields.getTextInputValue("messageContent")

      try {
        const embedSanctionToUser = new Discord.EmbedBuilder()
          .setColor(Config.colors.mainServerColor)
          .setDescription(
            `### 👮 Arbitrage LSX\n\n${reqMessageContent}\n\n-# L'équipe LSX`
          )
          .setTimestamp()

        const interactionReplyEmbed = new Discord.EmbedBuilder()
          .setColor(Config.colors.checkColor)
          .setDescription(
            `${Config.emojis.checkEmoji} **Le message a bien été envoyer à ${user}**`
          )

        user.send({ embeds: [embedSanctionToUser] })
        await interaction.reply({
          embeds: [interactionReplyEmbed],
          ephemeral: true,
        })
      } catch (error) {
        errorHandler(Discord, bot, interaction, Config, error)
      }
    }
  }

  if (interaction.type === Discord.InteractionType.ApplicationCommand) {
    let command = require(`../commands/${interaction.commandName}`)
    command.run(bot, interaction, interaction.options)
  }
}
