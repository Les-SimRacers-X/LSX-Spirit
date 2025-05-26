const {
  eventGestionDisplay,
} = require("../../components/module-events/eventGestionDisplay")
const {
  interactionGlobalBotGestion,
} = require("../../components/module-events/interactionGlobalGestion")

module.exports = {
  customId: "botManagment",
  async execute(interaction) {
    const selectedValue = interaction.values[0]

    switch (selectedValue) {
      case "events": {
        const { embeds, components } = await eventGestionDisplay(0)

        return interaction.reply({
          embeds,
          components,
          ephemeral: true,
        })
      }

      default: {
        return interaction.update({
          components: [interactionGlobalBotGestion()],
        })
      }
    }
  },
}
