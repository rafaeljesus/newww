var merge = require("lodash").merge,
    URL = require("url"),
    isURL = require("is-url"),
    avatar = require("../lib/avatar"),
    atty = new RegExp("^@");

module.exports = function(user) {
  user = merge({}, user);
  user.emailObfuscated = obfuscateEmail(user.email);
  user.avatar = avatar(user.email);
  user.meta = deriveMetaObjectFromFieldsArray(user.resource);
  return user;
};

var obfuscateEmail = function(email) {
  if (!email || typeof email !== "string") { return email; }
  return Array.prototype.map.call(email, function (x) {
    return '%' + x.charCodeAt(0).toString(16);
  }).join('');
};

var deriveMetaObjectFromFieldsArray = function(resources) {
  var meta = {};

  if (!resources) {
    return meta;
  }

  meta.homepage = resources.homepage && sanitizeHomepage(resources.homepage);
  meta.github = resources.github && sanitizeGitHubHandle(resources.github);
  meta.twitter = resources.twitter && sanitizeTwitterHandle(resources.twitter);
  meta.freenode = resources.freenode;

  return meta;
};

var sanitizeHomepage = function(input) {
  // URL
  if (isURL(input)) { return input; }

  // Not-fully-qualified URL
  if (isURL("http://"+input)) { return "http://"+input; }
};

var sanitizeTwitterHandle = function(input) {
  // URL
  if (isURL(input)) { return URL.parse(input).path.replace("/", ""); }

  // Not-fully-qualified URL
  var twittery = new RegExp("^twitter.com/", "i");
  if (input.match(twittery)) { return input.replace(twittery, ""); }

  // Starts with @
  if (input.match(atty)) { return input.replace(atty, ""); }

  return input;
};

var sanitizeGitHubHandle = function(input) {
  // URL
  if (isURL(input)) { return URL.parse(input).path.replace("/", ""); }

  // Not-fully-qualified URL
  var githubby = new RegExp("^github.com/", "i");
  if (input.match(githubby)) { return input.replace(githubby, ""); }

  // Starts with @
  if (input.match(atty)) { return input.replace(atty, ""); }

  return input;
};
