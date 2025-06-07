const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

async function interactionOnProfil(userId, options, gameSelected) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`interactionOnProfil_${userId}_${gameSelected}`)
      .setPlaceholder('📌 Sélectionner une option...')
      .addOptions(options)
  );
}

module.exports = { interactionOnProfil };
