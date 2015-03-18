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
    register: require('../services/downloads'),
    options: config.downloads
  },
  {
    register: require('./bonbon'),
    options: {
      stamp: config.stamp,
      canonicalHost: config.canonicalHost,
      lang: "en_US"
    }
  }
];
