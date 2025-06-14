module.exports = {
  PNG: 'https://i.ibb.co/vZRrf9d/fond-sans-fond.png',
  colors: {
    mainServerColor: '#273e8d',
    default: '#2b2d31',
    error: '#ff0000',
    success: '#1fff00',
    warning: '#fff300',
  },
  emotes: {
    serverEmote: {
      id: '',
      name: 'lsx',
    },
    error: {
      id: '1375923127124758588',
      name: 'erreur',
    },
    failure: {
      id: '1375923125577056266',
      name: 'failure',
    },
    success: {
      id: '1375923123945209907',
      name: 'check',
    },
    warning: {
      id: '1375923132656779264',
      name: 'warn',
    },
    previousArrow: {
      id: '1375923131004227795',
      name: 'previousEmote',
    },
    nextArrow: {
      id: '1375923128814927922',
      name: 'nextEmote',
    },
  },
  categories: {
    events: ['1349479229242347592', '1349479229640937502'],
    console: '1349479229242347592',
    general: '1349479229242347600',
    team: '1349479229640937502',
  },
  channels: {
    accChannels: ['', ''],
    monitoringServer: '1349479229519040513',
    licence: '1349479229519040514',
    logs: '1349479229833744502',
    botGestion: '1349479229833744499',
    errorLogs: '1349479229833744501',
  },
  roles: {
    spectator: '1349479229234090144',
    team: '1349479229234090144',
    steward: '1349479229225439261',
    member: '',
  },
  gameSpecificConfigs: {
    acc: {
      name: 'Assetto Corsa Competizione',
      category: '',
      channels: [],
      requiredFields: ['id', 'name', 'trigram', 'platform', 'number'],
    },
    lmu: {
      name: 'Le Mans Ultimate',
      category: '1349479229242347592',
      channels: ['1375922411274506260'],
      requiredFields: ['name', 'trigram', 'platform', 'number'],
    },
    f1: {
      name: 'Formula 1',
      category: '',
      channels: [],
      requiredFields: ['name', 'trigram', 'platform', 'number'],
    },
  },
  platforms: [
    {
      name: 'PC',
      emote: {
        id: '1377036068955619360',
        name: 'windowsLogo',
      },
      value: 'PC',
    },
    {
      name: 'Playstation',
      emote: {
        id: '1377036064715178055',
        name: 'playLogo',
      },
      value: 'Playstation',
    },
    {
      name: 'Xbox',
      emote: {
        id: '1377036066099302430',
        name: 'XboxLogo',
      },
      value: 'Xbox',
    },
  ],
  games: [
    {
      name: 'Assetto Corsa Competizione',
      emote: {
        id: '1375937836171399178',
        name: 'acc',
      },
      value: 'acc',
    },
    {
      name: 'Le Mans Ultimate',
      emote: {
        id: '1375937834233364521',
        name: 'lmu',
      },
      value: 'lmu',
    },
  ],
  countries: [
    {
      name: 'Australie',
      flag: '🇦🇺',
      value: '🇦🇺-Australie',
    },
    {
      name: 'Autriche',
      flag: '🇦🇹',
      value: '🇦🇹-Autriche',
    },
    {
      name: 'Belgique',
      flag: '🇧🇪',
      value: '🇧🇪-Belgique',
    },
    {
      name: 'Brésil',
      flag: '🇧🇷',
      value: '🇧🇷-Brésil',
    },
    {
      name: 'Canada',
      flag: '🇨🇦',
      value: '🇨🇦-Canada',
    },
    {
      name: 'Chine',
      flag: '🇨🇳',
      value: '🇨🇳-Chine',
    },
    {
      name: 'Danemark',
      flag: '🇩🇰',
      value: '🇩🇰-Danemark',
    },
    {
      name: 'Espagne',
      flag: '🇪🇸',
      value: '🇪🇸-Espagne',
    },
    {
      name: 'États-Unis',
      flag: '🇺🇸',
      value: '🇺🇸-États-Unis',
    },
    {
      name: 'Finlande',
      flag: '🇫🇮',
      value: '🇫🇮-Finlande',
    },
    {
      name: 'France',
      flag: '🇫🇷',
      value: '🇫🇷-France',
    },
    {
      name: 'Allemagne',
      flag: '🇩🇪',
      value: '🇩🇪-Allemagne',
    },
    {
      name: 'Hongrie',
      flag: '🇭🇺',
      value: '🇭🇺-Hongrie',
    },
    {
      name: 'Inde',
      flag: '🇮🇳',
      value: '🇮🇳-Inde',
    },
    {
      name: 'Italie',
      flag: '🇮🇹',
      value: '🇮🇹-Italie',
    },
    {
      name: 'Japon',
      flag: '🇯🇵',
      value: '🇯🇵-Japon',
    },
    {
      name: 'Mexique',
      flag: '🇲🇽',
      value: '🇲🇽-Mexique',
    },
    {
      name: 'Monaco',
      flag: '🇲🇨',
      value: '🇲🇨-Monaco',
    },
    {
      name: 'Pays-Bas',
      flag: '🇳🇱',
      value: '🇳🇱-Pays-Bas',
    },
    {
      name: 'Nouvelle-Zélande',
      flag: '🇳🇿',
      value: '🇳🇿-Nouvelle-Zélande',
    },
    {
      name: 'Pologne',
      flag: '🇵🇱',
      value: '🇵🇱-Pologne',
    },
    {
      name: 'Portugal',
      flag: '🇵🇹',
      value: '🇵🇹-Portugal',
    },
    {
      name: 'Russie',
      flag: '🇷🇺',
      value: '🇷🇺-Russie',
    },
    {
      name: 'Suède',
      flag: '🇸🇪',
      value: '🇸🇪-Suède',
    },
    {
      name: 'Royaume-Uni',
      flag: '🇬🇧',
      value: '🇬🇧-Royaume-Uni',
    },
  ],
};
