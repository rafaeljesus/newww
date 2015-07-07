var _            = require('lodash');
var assert       = require('assert');
var async        = require('async');
// var LICENSE_HOST = process.env.LICENSE_API || "https://license-api-example.com";
var Request      = require('../lib/external-request');
var USER_HOST    = process.env.USER_API || "https://user-api-example.com";

var Org = module.exports;

Org.get = function (name, callback) {
  assert(_.isString(name), "name must be a string");

  var orgUrl = USER_HOST + '/org/' + name;
  var userUrl = USER_HOST + '/org/' + name + '/user';

  var makeRequest = function (url) {
    return function (cb) {

      Request({
        url: url,
        json: true,
      }, function (err, resp, body) {
        if (err) { return cb(err); }

        if (resp.statusCode === 404) {
          err = Error('org not found');
          err.statusCode = resp.statusCode;
          return cb(err);
        }

        return cb(null, body);
      });
    };
  };

  var requests = {
    org: makeRequest(orgUrl),
    users: makeRequest(userUrl)
  };

  async.parallel(requests, function (err, results) {
    if (err) { return callback(err, {}); }

    var org = {};

    org.info = results.org;
    org.users = results.users.items;

    return callback(null, org);
  });
};