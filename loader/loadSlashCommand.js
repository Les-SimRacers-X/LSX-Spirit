const Discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");

module.exports = async (bot) => {
  const commands = bot.commands.map((command) => {
    if (command.type === "USER") {
      // Si c'est une User Command
      return new Discord.ContextMenuCommandBuilder()
        .setName(command.name)
        .setType(Discord.ApplicationCommandType.User)
        .toJSON();
    } else {
      // Par défaut, considérer comme Slash Command
      const slashcommand = new Discord.SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description)
        .setDMPermission(command.dm)
        .setDefaultMemberPermissions(
          command.permission === "Aucune" ? null : command.permission
        );

      if (command.options?.length >= 1) {
        command.options.forEach((option) => {
          const optionType =
            option.type.charAt(0).toUpperCase() + option.type.slice(1);

          if (option.type === "string") {
            slashcommand[`add${optionType}Option`]((opt) =>
              opt
                .setName(option.name)
                .setDescription(option.description)
                .setAutocomplete(option.autocomplete)
                .setRequired(option.required)
            );
          } else {
            slashcommand[`add${optionType}Option`]((opt) =>
              opt
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required)
            );
          }
        });
      }

      return slashcommand.toJSON();
    }
  });

  const rest = new REST({ version: "10" }).setToken(bot.token);

  await rest.put(Routes.applicationCommands(bot.user.id), { body: commands });
  console.log("All application commands loaded successfully!");
};
