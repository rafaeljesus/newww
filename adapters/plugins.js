var config = require('../config');

// all those plugins
module.exports = [
  {
    register: require('crumb'),
    options: {cookieOptions: { isSecure: true }}
  },
  require('scooter'),
  {
    register: require('blankie'),
    options: require('../lib/csp').default
  },
  require('../services/user'),
  require('../services/corporate'),
  require('../services/email'),
  {
    register: require('../services/npme'),
    options: config
  },
  {
    register: require('./bonbon'),
    options: {
      lang: "en_US"
    }
  }
];
