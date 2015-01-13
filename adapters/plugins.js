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
  {
    register: require('../services/user'),
    options: config.couch
  },
  require('../services/registry'),
  require('../services/corporate'),
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
