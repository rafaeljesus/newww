var fixtures = require('../fixtures.js');

module.exports = function(server) {
  var methods = {

    corp: {
      getPage: function(name, next) {
        if (name === 'jobs') {
          return next(null, "<h1 id='jobs'>JOBS</h1>");
        }

        return next(new Error('OMGBOOM'));
      },

      getPolicy: function(name, next) {
        if (fixtures.policies[name]) {
          return next(null, fixtures.policies[name]);
        }

        return next(new Error('Not Found'));
      }
    },

    npme: {

      updateCustomer: function(customerId, data, callback) {
        return callback(null);
      },

      verifyTrial: function(verificationKey, next) {
        switch (verificationKey) {
          case '12345':
          case '12ab34cd-a123-4b56-789c-1de2f3ab45cd':
            return next(null, fixtures.enterprise.newTrial);
          case '23456':
            return next(null, fixtures.enterprise.noCustomerTrial);
          case 'noLicense':
            return next(null, fixtures.enterprise.noLicenseTrial);
          case 'tooManyLicenses':
            return next(null, fixtures.enterprise.tooManyLicensesTrial);
          case 'licenseBroken':
            return next(null, fixtures.enterprise.licenseBrokenTrial);
          default:
            return next(new Error('cannot verify trial'));
        }
      }
    },

    user: {
      delSession: require('../../services/user/methods/sessions').del,
      setSession: require('../../services/user/methods/sessions').set
    }
  };

  return methods;
};