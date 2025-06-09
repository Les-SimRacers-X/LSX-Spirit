const { Events, InteractionType } = require('discord.js');
const { errorHandler } = require('../context/utils/errorHandling');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  async execute(bot, interaction) {
    /* === Slash Commands === */
    if (interaction.type === InteractionType.ApplicationCommand) {
      try {
        const command = require(`../commands/${interaction.commandName}`);
        command.run(bot, interaction, interaction.options);
      } catch (err) {
        await errorHandler(interaction, err);
      }
      return;
    }

    /* === Buttons, Modals, Selectors === */
    const folders = ['buttons', 'modals', 'selects'];
    for (const folder of folders) {
      const folderPath = path.join(
        __dirname,
        `../components/interactions/${folder}`
      );
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        const handler = require(path.join(folderPath, file));
        const customIds = Array.isArray(handler.customId)
          ? handler.customId
          : [handler.customId];

        if (
          customIds.some(
            (id) =>
              interaction.customId === id ||
              interaction.customId.startsWith(id + '_')
          )
        ) {
          try {
            await handler.execute(interaction);
          } catch (err) {
            await errorHandler(interaction, err);
          }
        }
      }
    }
  },
};
