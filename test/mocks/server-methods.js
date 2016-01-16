var Boom = require('boom');
var murmurhash = require('murmurhash');
var crypto = require('crypto');
var fixtures = require('../fixtures.js');
var Promise = require('bluebird');
var assert = require('assert');
var sendEmail = require('../../services/email/methods/send');
var MockTransport = require('nodemailer-mock-transport');

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

    downloads: {
      getAllDownloads: function(next) {
        var d = {
          day: 0,
          week: 0,
          month: 0
        };

        return next(null, d);
      },

      getAllDownloadsForPackage: function(name, next) {
        var d = [
          {
            day: 32789,
            week: 268291,
            month: 1480446
          },
          null,
          {
            msec: 3,
            error: null
          }
        ];

        return next(null, d);
      },

      getDownloadsForPackage: function(period, detail, pkg, next) {
        return next(null, [{
          day: '2014-07-12',
          downloads: 0
        }, {
          day: '2014-07-13',
          downloads: 0
        }]);
      }
    },

    email: {
      send: function(template, user, redis) {
        assert(typeof redis === 'object', 'whoops need redis');

        if (user.email === 'lolbad@email') {
          return Promise.reject(new Error('no bueno yo'))
        }

        return sendEmail(template, user, redis);
      }
    },

    npme: {
      createCustomer: function(data, next) {
        return next(null, fixtures.enterprise.newUser);
      },

      createLicense: function(licenseDetails, callback) {
        return callback(null, fixtures.enterprise.goodLicense[0]);
      },

      createTrial: function(customer, next) {
        return next(null, customer);
      },

      getCustomer: function(email, next) {
        var key = typeof (email) === 'string' ? email.split('@')[0] : email;

        switch (key) {
          case 'exists':
          case 123:
            // user already exists
            return next(null, fixtures.enterprise.existingUser);
          case 'new':
          case 345:
            // user doesn't exist yet
            return next(null, null);
          case 'noLicense':
            // for license testing
            return next(null, fixtures.enterprise.noLicenseUser);
          case 'badLicense':
            // for license testing
            return next(null, fixtures.enterprise.noLicenseUser);
          case 'tooManyLicenses':
            // for license testing
            return next(null, fixtures.enterprise.tooManyLicensesUser);
          case 'licenseBroken':
            // for license testing
            return next(null, fixtures.enterprise.licenseBrokenUser);
          default:
            // something went wrong with hubspot
            return next(new Error('something went wrong'));
        }
      },

      getLicense: function(productId, customerId, licenseId, next) {
        var key = customerId.split('@')[0];

        switch (key) {
          case 'badLicense':
            return next(null, null);
          case 'new':
            return next(null, fixtures.enterprise.newLicense[0]);
          case 'exists':
            return next(null, fixtures.enterprise.goodLicense[0]);
          default:
            return next(new Error('license machine brokened'));
        }
      },

      getLicenses: function(productId, customerId, next) {
        var key = customerId.split('@')[0];

        switch (key) {
          case 'noLicense':
            return next(null, fixtures.enterprise.noLicense);
          case 'tooManyLicenses':
            return next(null, fixtures.enterprise.tooManyLicenses);
          case 'exists':
            return next(null, fixtures.enterprise.goodLicense);
          default:
            return next(new Error('license machine brokened'));
        }
      },

      sendData: function(formID, data, next) {
        if (data.email.indexOf('error') !== -1) {
          return next(new Error('ruh roh broken'));
        }

        return next(null);
      },

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

  sendEmail.mailConfig.mailTransportModule = new MockTransport();
  methods.email.send.mailConfig = sendEmail.mailConfig;

  return methods;
};

function passHash(auth) {
  return crypto.pbkdf2Sync(auth.password, fixtures.users[auth.name].salt, fixtures.users[auth.name].iterations, 20).toString('hex');
}
