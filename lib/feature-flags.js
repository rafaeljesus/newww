var humans = require('npm-humans')

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
}

module.exports = function isFeatureEnabled (feature, request) {
  var setting = process.env['FEATURE_' + feature.replace(/^feature_/i, "").toUpperCase()]

  if (!setting || !setting.length || setting.toLowerCase() === 'false') {
    return false
  }

  if (setting.toLowerCase() === 'true') {
    return true
  }

  if (request && request.auth && request.auth.credentials) {
    var allowedUsers = []
    setting.split(/\,\s?/).forEach(function (name) {
      if (name.match(/^group:/)) {
        name = name.replace(/^group:/, '')
        var group = groups[name]
        if (!group) throw ('invalid feature flag group: ' + name)
        allowedUsers = allowedUsers.concat(group)
      } else {
        allowedUsers.push(name)
      }
    })

    return allowedUsers.indexOf(request.auth.credentials.name) > -1
  }

  return false
}
