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
  {
    register: require('blankie'),
    options: require('../lib/csp').default
  },
  require('../services/user'),
  require('../services/corporate'),
  require('../services/email'),
  require('../services/npme'),
  {
    register: require('./bonbon'),
    options: {
      lang: "en_US"
    }
  }
];
