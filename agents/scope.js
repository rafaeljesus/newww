var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";
var P = require('bluebird');

var Scope = module.exports = function() {
  if (!(this instanceof Scope)) {
    return new Scope();
  }
};


Scope.prototype.get = function(name, callback) {
  var url = USER_HOST + '/scope/' + name;

  var opts = {
    url: url,
    json: true
  };

  return new P(function(resolve, reject) {
    Request.get(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('scope not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).asCallback(callback);

};
