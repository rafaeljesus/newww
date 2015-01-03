var request = require('request'),
    log = require('bole')('npme-create-trial');

module.exports = function createTrial (options) {

  return function (customer, callback) {

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
          return callback(null, trial);
        case 404:
          // do not already have a trial, so create one
          return createNewTrial(customer, callback);
        default:
          var msg = 'Error with getting trial info for ' + customer.email;
          log.error(msg);
          er = er || new Error(msg);
          log.error(er);

          return callback(er);
      }
    });
  };

  function createNewTrial (customer, callback) {

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

      if (resp.statusCode === 200) {
        return callback(null, trial);
      }

      var msg = 'Error with creating a trial for ' + customer.email;
      err = err || new Error(msg);
      log.error(msg);
      log.error(err);
      return callback(err);
    });
  }
};