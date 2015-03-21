var request = require('request'),
    log = require('bole')('npme-create-trial'),
    config = require('../../../config'),
    trial_length = 30,
    trial_seats = 50;

module.exports = function (customer, callback) {

  var trialEndpoint = process.env.LICENSE_API + '/trial',
      productId = process.env.NPME_PRODUCT_ID;

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

  var trialEndpoint = process.env.LICENSE_API + '/trial',
      productId = process.env.NPME_PRODUCT_ID,
      trialLength = trial_length,
      trialSeats = trial_seats;

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
