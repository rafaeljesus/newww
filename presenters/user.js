var merge = require("lodash").merge
var URL = require("url")
var isURL = require("is-url")
var atty = new RegExp("^@")

module.exports = function(user) {
  user = merge({}, user)
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
      if (field.name === "github") {
        meta["github"] = sanitizeGitHubHandle(field.value)
      }

      if (field.name === "twitter") {
        meta["twitter"] = sanitizeTwitterHandle(field.value)
      }
    })

  return meta
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
