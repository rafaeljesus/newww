var merge = require("lodash").merge,
  URL = require("url"),
  isURL = require("is-url"),
  avatar = require("../lib/avatar");

module.exports = function(user) {
  user = merge({}, user);
  user.emailObfuscated = obfuscateEmail(user.email);
  user.avatar = avatar(user.email);
  sanitizeResources(user.resource);
  return user;
};

var obfuscateEmail = function(email) {
  if (!email || typeof email !== "string") {
    return email;
  }
  return Array.prototype.map.call(email, function(x) {
    return '%' + x.charCodeAt(0).toString(16);
  }).join('');
};

var sanitizeResources = function sanitizeResources(resources) {
  if (!resources) return
  Object.keys(resources).forEach(function(key) {
    var value = resources[key]
    if (!key || !value) {
      delete resources[key]
    }

    if (key in sanitizers) {
      resources[key] = sanitizers[key](value)
    }
  })
}

var sanitizers = {

  homepage: function(input) {
    // URL
    if (isURL(input)) {
      return input;
    }

    // Not-fully-qualified URL
    if (isURL("http://" + input)) {
      return "http://" + input;
    }

    return '';
  },

  twitter: function(input) {
    // URL
    if (isURL(input)) {
      return URL.parse(input).path.replace("/", "");
    }

    // Not-fully-qualified URL
    var twittery = new RegExp("^twitter.com/", "i");
    if (input.match(twittery)) {
      return input.replace(twittery, "");
    }

    return input.replace("@", "");
  },

  github: function(input) {
    // URL
    if (isURL(input)) {
      return URL.parse(input).path.replace("/", "");
    }

    // Not-fully-qualified URL
    var githubby = new RegExp("^github.com/", "i");
    if (input.match(githubby)) {
      return input.replace(githubby, "");
    }

    return input.replace("@", "");
  },

  npmweekly: alwaysIncludeAsIs,
  dripcampaigns: alwaysIncludeAsIs
}

function alwaysIncludeAsIs(input) {
    return input;
}
