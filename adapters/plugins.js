module.exports = [
  {
    register: require('crumb'),
    options: {
      cookieOptions: {
        isSecure: true
      }
    }
  },
  require('scooter'),
  require('inert'),
  require('vision'),
  {
    register: require('blankie'),
    options: require('../lib/csp').default
  },
  require('../services/user'),
  require('../services/corporate'),
  require('../services/npme'),
  {
    register: require('./bonbon'),
    options: {
      lang: "en_US"
    }
  },
  require('hapi-stateless-notifications'),
  require('../lib/error-handler')
];
