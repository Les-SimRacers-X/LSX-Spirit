const path = require('path');
const merge = require('lodash.merge');

const env =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';

let productionConfig = {};
try {
  productionConfig = require(path.join(__dirname, 'production'));
} catch (e) {
  console.error(
    'Aucun fichier de configuration production trouvé (production.js) !'
  );
  process.exit(1);
}

let envConfig = {};
if (env === 'development') {
  try {
    envConfig = require(path.join(__dirname, 'development'));
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.error(
        `Erreur lors du chargement de la configuration pour l'environnement "${env}":`,
        e
      );
    }
  }
}

const Config = merge(productionConfig, envConfig);

module.exports = { Config };
