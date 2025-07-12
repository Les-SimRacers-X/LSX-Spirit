const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require('psn-api');
const axios = require('axios');
const { errorHandler } = require('./errorHandling');
require('dotenv').config();

async function getConsoleUXID(username, platform) {
  if (platform === 'Playstation') {
    try {
      const accessCode = await exchangeNpssoForCode(process.env.PSN_APIKEY);
      const accessToken = await exchangeCodeForAccessToken(accessCode);
      const userProfile = await getProfileFromUserName(accessToken, username);

      if (userProfile?.profile?.accountId) {
        return { platform: 'P', id: userProfile.profile.accountId };
      }
    } catch (error) {
      await errorHandler(_, error);
    }
  }

  if (platform === 'Xbox') {
    try {
      const response = await axios.get(
        `https://xbl.io/api/v2/search/${username}`,
        {
          headers: {
            'X-Authorization': process.env.XBOX_APIKEY,
          },
        }
      );
      if (response.data.people && response.data.people.length > 0) {
        return { platform: 'M', id: response.data.people[0].xuid };
      }
    } catch (error) {
      await errorHandler(_, error);
    }
  }

  return undefined;
}

module.exports = { getConsoleUXID };
