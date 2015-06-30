var _            = require('lodash');
var async        = require('async');
var LICENSE_HOST = process.env.USER_API || "https://user-api-example.com";
var Request      = require('../lib/external-request');
var USER_HOST    = process.env.USER_API || "https://user-api-example.com";

var Org = module.exports;

Org.get = function (name, loggedInUser, callback) {
  var orgUrl = USER_HOST + '/org/' + name;
  var userUrl = USER_HOST + '/org/' + name + '/user';

  var makeRequest = function (url) {
    return function (cb) {

      Request({
        url: url,
        json: true,
        headers: {bearer: loggedInUser}
      }, function (err, resp, body) {

        if (err) { return cb(err); }
        return cb(null, body);
      });
    };
  };

  var requests = {
    org: makeRequest(orgUrl),
    users: makeRequest(userUrl)
  };

  async.parallel(requests, function (err, results) {
    if (err) { return callback(err); }

    var org = {};

    org.info = results.org;
    org.users = results.users;

    return callback(null, org);
  });
};