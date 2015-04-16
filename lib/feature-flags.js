var _ = require('lodash'),
    humans = require('npm-humans');

var groups = {
  friends: [
    'aredridel',
    'groundwater',
    'jdalton',
    'ljharb',
    'maxogden',
    'mikeal',
    'smikes'
  ],
  'npm-humans': Object.keys(humans)
};

var featureCache = {};

function calculate(feature) {
  var setting = process.env['FEATURE_' + feature.replace(/^feature_/i, "").toUpperCase()]

  if (!setting || !setting.length || setting.toLowerCase() === 'false') {
    featureCache[feature] = false;
  }
  else if (setting.toLowerCase() === 'true') {
    featureCache[feature] = true;
  }
  else {
    var allowedUsers = [];
    setting.split(/\,\s?/).forEach(function (name) {
      if (name.match(/^group:/)) {
        name = name.replace(/^group:/, '');
        var group = groups[name];
        if (!group) { throw ('invalid feature flag group: ' + name); }
        allowedUsers = allowedUsers.concat(group);
      } else {
        allowedUsers.push(name);
      }
    });
    featureCache[feature] = allowedUsers;
  }
}

var isFeatureEnabled = module.exports = function isFeatureEnabled (feature, request) {
  if (!featureCache.hasOwnProperty(feature)) {
    calculate(feature);
  }
  var value = featureCache[feature];
  if (_.isBoolean(value)) { return value; }

  if (Array.isArray(value) && request && request.auth && request.auth.credentials) {
    return value.indexOf(request.auth.credentials.name) > -1;
  }

  return false;
};

isFeatureEnabled.calculate = calculate;
isFeatureEnabled.cache = featureCache;
