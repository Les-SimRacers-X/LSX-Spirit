const {
  eventGestionDisplay,
} = require("../../modules/module-events/eventGestionDisplay")
const {
  interactionGlobalBotGestion,
} = require("../../modules/module-events/interactionGlobalGestion")
const {
  presetGestionDisplay,
} = require("../../modules/module-presets/presetGestionDisplay")
const {
  trackGestionDisplay,
} = require("../../modules/module-tracks/trackGestionDisplay")

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

      case "presets": {
        const { embeds, components } = await presetGestionDisplay(0)

        return interaction.reply({
          embeds,
          components,
          ephemeral: true,
        })
      }

      case "tracks": {
        const { embeds, components } = await trackGestionDisplay(0)

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
