var Hoek = require('hoek');

var locales = {
  en_US: require('../locales/en_US/index')
};

module.exports = function t (path, lang) {
  return Hoek.reach(locales[lang], path);
};
