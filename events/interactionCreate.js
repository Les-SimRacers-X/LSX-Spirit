const { Events, InteractionType } = require("discord.js")
const { errorHandler } = require("../functions/utils")

module.exports = {
  name: Events.InteractionCreate,
  async execute(bot, interaction) {
    /* === Slash Commands === */
    if (interaction.type === InteractionType.ApplicationCommand) {
      try {
        let command = require(`../commands/${interaction.commandName}`)
        command.run(bot, interaction, interaction.options)
      } catch (err) {
        errorHandler(interaction, err)
      }
      return
    }

    /* === Applications Commands === */
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = bot.commands.get(interaction.commandName)
      if (!command) return

      try {
        await command.run(bot, interaction, interaction.options)
      } catch (error) {
        errorHandler(interaction, error)
      }
    }

    /* === Buttons, Modals, Selectors === */
    const folders = ["buttons", "modals", "selects"]
    for (const folder of folders) {
      const folderPath = path.join(__dirname, `../interactions/${folder}`)
      const files = fs.readdirSync(folderPath)

      for (const file of files) {
        const handler = require(path.join(folderPath, file))
        const customIds = Array.isArray(handler.customId)
          ? handler.customId
          : [handler.customId]

        if (
          customIds.some(
            (id) =>
              interaction.customId === id ||
              interaction.customId.startsWith(id + "_")
          )
        ) {
          try {
            return await handler.execute(interaction)
          } catch (err) {
            errorHandler(interaction, err)
          }
        }
      }
    }
  },
}
