var request = require('request');
var _ = require('lodash');

var api = module.exports = function(opts) {
  _.extend({
    billingApi: process.env.BILLING_API || 'https://billing-api-example.com'
  }, opts);
}

api.prototype.get = function(name, callback) {
  var url = process.env.BILLING_API + '/stripe/' + name;
  request.get({url: url, json: true}, function(err, resp, body){

    // Coerce integer into date
    if (body && body.next_billing_date ){
      body.next_billing_date = new Date(body.next_billing_date)
    }

    return callback(err, resp, body)
  });
}

api.prototype.update = function(body, callback) {
  var url
  this.get(body.name, function(err, resp, getUserBody) {
    if (err) return callback(err);
    switch (resp.statusCode) {
      case 200:
        // Customer exists; Update
        url = process.env.BILLING_API + '/stripe/' + body.name;
        request.post({url: url, json: true, body: body}, callback);
        break
      case 404:
        // Customer does not exist; Create
        url = process.env.BILLING_API + '/stripe'
        request.put({url: url, json: true, body: body}, callback);
        break;
      default:
        return callback("Unexpected response from Billing API: " + resp.statusCode)
    }

  })
}

api.prototype.del = function(name, callback) {
  var url = process.env.BILLING_API + '/stripe/' + name;
  request.del({url: url, json: true}, callback);
}
