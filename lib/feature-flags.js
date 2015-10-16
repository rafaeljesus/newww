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
  'npm-humans': Object.keys(humans).map(function(human) {
    return humans[human].username;
  })
};

var featureCache = {};

function calculate(feature) {
  var setting = process.env['FEATURE_' + feature.replace(/^feature_/i, "").toUpperCase()];
  if (!setting || !setting.length || setting.toLowerCase() === 'false') {
    featureCache[feature] = false;
  } else if (setting.toLowerCase() === 'true') {
    featureCache[feature] = true;
  } else {
    var allowedUsers = [];
    setting.split(/\,\s?/).forEach(function(name) {
      if (name.match(/^group:/)) {
        name = name.replace(/^group:/, '');
        var group = groups[name];
        if (!group) {
          throw ('invalid feature flag group: ' + name);
        }
        allowedUsers = allowedUsers.concat(group);
      } else if (name.match(/^regex:/)) {
        name = new RegExp(name.replace(/^regex:/, ''));
        allowedUsers.push(name);
      } else {
        allowedUsers.push(name);
      }
    });
    featureCache[feature] = allowedUsers;
  }
}

var isFeatureEnabled = module.exports = function isFeatureEnabled(feature, request) {

  if (!featureCache.hasOwnProperty(feature)) {
    calculate(feature);
  }

  var value = featureCache[feature];
  if (_.isBoolean(value)) {
    return value;
  }

  if (Array.isArray(value) && request && request.auth && request.auth.credentials) {
    var name = request.auth.credentials.name;
    return value.some(function(potentialUser) {
      return potentialUser === request.auth.credentials.name ||
        typeof potentialUser.test === 'function' && potentialUser.test(name);
    });
  }

  return false;
};

var filterFeatures = function filterFeatures(features) {
  return _.pick(features, function(val, key) {
    return key.match(/^feature_/i);
  });
};

var getFeatures = function getFeatures(request) {
  var features = {};

  var envFeatures = filterFeatures(process.env);
  var userFeatures = filterFeatures(request.loggedInUser && request.loggedInUser.resource);

  _.forEach(envFeatures, function(val, key) {
    key = key.replace(/^feature_/i, "").toLowerCase();
    features[key] = isFeatureEnabled(key, request);
  });

  _.forEach(userFeatures, function(val, key) {
    key = key.replace(/^feature_/i, "").toLowerCase();
    features[key] = val === 't';
  });

  return features;
};

isFeatureEnabled.calculate = calculate;
isFeatureEnabled.cache = featureCache;
isFeatureEnabled.getFeatures = getFeatures;
isFeatureEnabled.filterFeatures = filterFeatures;
