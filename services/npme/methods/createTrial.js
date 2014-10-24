var request = require('request'),
    log = require('bole')('npme-create-trial'),
    uuid = require('node-uuid');

module.exports = function createTrial (options) {

  return function (customer, next) {

    var trialEndpoint = options.license.api + '/trial',
        productId = options.npme.product_id;

    // check if they already have a trial; 1 per customer
    request.get({
      url: trialEndpoint + '/' + productId + '/' + customer.email,
      json: true
    }, function(er, resp, trial) {

      switch (resp.statusCode) {
        case 200:
          // they already have a trial
          return next(null, trial);
          break;
        case 404:
          // do not already have a trial, so create one
          return createNewTrial(customer, next);
          break;
        default:
          return next(er || new Error('Error with getting trial info for ' + customer.email));
          break;
      }
    });
  }

  function createNewTrial (customer, next) {

    var trialEndpoint = options.license.api + '/trial',
        productId = options.npme.product_id,
        trialLength = options.npme.trial_length,
        trialSeats = options.npme.trial_seats;

    request.put({
      url: trialEndpoint,
      json: {
        customer_id: customer.id,
        product_id: productId,
        length: trialLength,
        seats: trialSeats
      }
    }, function (err, resp, trial) {

      if (resp.statusCode !== 200) {
        return next(err || new Error('Error with creating a trial for ' + customer.email));
      }

      return next(null, trial);

    });
  }
}