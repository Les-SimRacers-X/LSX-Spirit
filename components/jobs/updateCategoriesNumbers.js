const { ChannelType } = require('discord.js');
const { Config } = require('../../context/config');
const { errorHandler } = require('../../context/utils/errorHandling');

async function updateGeneralCategoryNumber(guild) {
  try {
    const category = guild.channels.cache.get(Config.categories.general);
    if (!category || category.type !== ChannelType.GuildCategory) {
      console.error(
        "La catégorie n'existe pas ou n'est pas uen catégorie valide."
      );
      return;
    }

    const memberCount = guild.memberCount;

    await category.setName(`📰 GÉNÉRAL : ${memberCount} Membres 📰`);
  } catch (error) {
    await errorHandler('', error);
  }
}

async function updateTeamCategoryNumber(guild) {
  try {
    const category = guild.channels.cache.get(Config.categories.team);
    if (!category || category.type !== ChannelType.GuildCategory) {
      console.error(
        "La catégorie n'existe pas ou n'est pas uen catégorie valide."
      );
      return;
    }

    const role = guild.roles.cache.get(Config.roles.team);
    if (!role) {
      console.error("Le rôle spécifié n'existe pas.");
      return;
    }
    const roleMemberCount = role.members.size;

    await category.setName(`🏆Team LSX : ${roleMemberCount} Pilotes🏆`);
  } catch (error) {
    await errorHandler('', error);
  }
}

module.exports = {
  updateGeneralCategoryNumber,
  updateTeamCategoryNumber,
};
