var request = require('request'),
    log = require('bole')('npme-create-customer'),
    config = require('../../../config')

module.exports = function(data, callback) {

  var customerEndpoint = process.env.LICENSE_API + '/customer';

  request.put({
    url: customerEndpoint,
    json: {
      email: data.email,
      name: data.firstname + ' ' + data.lastname,
      phone: data.phone
    }
  }, function(er, resp, newCustomer) {

    if (resp.statusCode === 200) {
      return callback(null, newCustomer);
    }

    log.warn('customer creation for user ' + data.email + ' failed with statusCode ' + resp.statusCode);
    log.warn(newCustomer);

    er = er || new Error('unable to create customer ' + data.email);

    log.error(er);

    return callback(er);
  });
};