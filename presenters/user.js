var merge = require("lodash").merge
var URL = require("url")
var isURL = require("is-url")
var atty = new RegExp("^@")

module.exports = function(user) {
  user = merge({}, user)

  user.emailObfuscated = obfuscateEmail(user.email)

  user.meta = deriveMetaObjectFromFieldsArray(user.fields)
  return user
}

var deriveMetaObjectFromFieldsArray = function(fields) {
  var meta = {}

  if (!Array.isArray(fields))
    return meta

  fields
    .filter(function(field){
      return field.name && field.value
    })
    .forEach(function(field){
      switch(field.name) {
        case "homepage":
          meta["homepage"] = sanitizeHomepage(field.value)
          break;
        case "github":
          meta["github"] = sanitizeGitHubHandle(field.value)
          break;
        case "twitter":
          meta["twitter"] = sanitizeTwitterHandle(field.value)
          break;
        case "freenode":
          meta["freenode"] = field.value
          break;
      }

      // Remove any null or empty metadata
      if (!meta[field.name]) {
        delete meta[field.name]
      }

    })

  return meta
}

var sanitizeHomepage = function(input) {
  // URL
  if (isURL(input)) return input

  // Not-fully-qualified URL
  if (isURL("http://"+input)) return "http://"+input
}

var sanitizeTwitterHandle = function(input) {
  // URL
  if (isURL(input)) return URL.parse(input).path.replace("/", "")

  // Not-fully-qualified URL
  var twittery = new RegExp("^twitter.com/", "i")
  if (input.match(twittery)) return input.replace(twittery, "")

  // Starts with @
  if (input.match(atty)) return input.replace(atty, "")

  return input
}

var sanitizeGitHubHandle = function(input) {
  // URL
  if (isURL(input)) return URL.parse(input).path.replace("/", "")

  // Not-fully-qualified URL
  var githubby = new RegExp("^github.com/", "i")
  if (input.match(githubby)) return input.replace(githubby, "")

  // Starts with @
  if (input.match(atty)) return input.replace(atty, "")

  return input
}

var obfuscateEmail = function(email) {
  if (!email || typeof email != "string") return email
  return Array.prototype.map.call(email, function (x) {
    return '%' + x.charCodeAt(0).toString(16)
  }).join('')
}
