var request = require('request'),
    log = require('bole')('npme-create-customer'),
    config = require('../../../config');

module.exports = function (customerId, data, callback) {

  var customerEndpoint = process.env.LICENSE_API + '/customer/' + customerId;

  request.post({
    url: customerEndpoint,
    json: data
  }, function(er, resp, customer) {

    if (resp.statusCode === 200) {
      return callback(null, customer);
    }

    log.warn('customer update for ' + customerId + ' failed with statusCode ' + resp.statusCode);
    log.warn(customer);

    er = er || new Error('unable to update customer ' + customerId);

    log.error(er);

    return callback(er);
  });
};