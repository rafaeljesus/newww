// replicate just enough records to be useful for testing.
// around 1000 packages, plus some known popular ones, and all
// the public user docs except 'admin', which is the user account
// to use for testing features.

var replicate = require('replicate')
, Replicator = replicate.Replicator
, request = require('request')
, initCouchDocs = require('./initCouchDocs')
, fs = require('fs')
, sampleUsers = require('./sample_users.json')
, _auth = require('./_auth.json')

var crypto = require('crypto')
function hash (id) {
  return crypto.createHash('sha1').update(id).digest('hex')
}

var popularPackages = ["underscore", "async", "request", "lodash",
"commander", "express", "optimist", "coffee-script", "colors", "mkdirp",
"debug", "q", "chalk", "yeoman-generator", "moment", "glob", "jade",
"uglify-js", "redis", "through2", "socket.io", "through", "node-uuid",
"cheerio", "gulp-util", "connect", "mime", "winston", "grunt", "mongodb",
"rimraf", "handlebars", "ejs", "semver", "mongoose", "underscore.string",
"marked", "minimist", "xml2js", "bluebird", "mocha", "fs-extra", "less",
"js-yaml", "superagent", "esprima", "stylus", "jsdom", "wrench", "jquery",
"xtend", "event-stream", "extend", "browserify", "minimatch", "shelljs",
"prompt", "pkginfo", "mysql", "ws", "readable-stream", "backbone", "when",
"nopt", "body-parser", "inherits", "cli-color", "passport", "concat-stream",
"nodemailer", "nconf", "validator", "yosay", "should", "clean-css", "qs",
"chai", "ncp", "mustache", "npm", "open", "requirejs", "aws-sdk",
"http-proxy", "temp", "graceful-fs", "hiredis", "socket.io-client", "gulp",
"oauth", "inquirer", "iconv-lite", "yargs", "escodegen", "uuid", "bower",
"log4js", "eventemitter2", "promise", "cli-table", "es6-shim", "benchmark"]

var packagesByZeke = ["app-cloner-heroku", "app-json-fetcher",
"app-profiler-heroku", "app.json", "apps", "bitbucket-url-to-object",
"carousel", "color-namer", "design", "dimensions", "envy-json",
"euclidean-distance", "faceplate", "flickr-set-downloader",
"geolocation-stream", "ghwd", "github-url-to-object",
"grunt-markdown2slides", "harp-from-the-future", "heroku-addons",
"heroku-auth-finder", "hk", "hk-manifest", "local-env", "markdown-index",
"markdown2slides", "moby", "node-version-resolver", "npe", "ord.zeke.xxx",
"package-json-to-readme", "redact-url", "schemeless", "scroll-fever",
"swagger", "thief", "wikipedia-translator", "wikipedias"]

var packagesByRockbot = ["couch-login", "googalytics", "newww",
"nodealytics", "npm-registry-couchapp", "redsess", "vektor"]

var crazyPackages = [
  'ifyouwanttogetthesumoftwonumberswherethosetwonumbersarechosenbyfindingthelargestoftwooutofthreenumbersandsquaringthemwhichismultiplyingthembyitselfthenyoushouldinputthreenumbersintothisfunctionanditwilldothatforyou',
  'dezalgo',
  'JSONStream',
  'grunt-compass'
]

function filterPackage (id, rev) {
  return !!(hash(id).match(/^00/)
    || popularPackages.indexOf(id) > -1
    || packagesByZeke.indexOf(id) > -1
    || packagesByRockbot.indexOf(id) > -1
    || crazyPackages.indexOf(id) > -1
    || id.match(/^(npm.*)$/))
}

// add some more once we've got the first batch
function filterPackageMore (id, rev) {
  return !!(hash(id).match(/^0/))
}

function filterUser (id, rev) {
  return id !== 'org.couchdb.user:admin'
}

// first sync up the design docs, since this is the most important
// thing for the dev server starting up properly.
function replicateDdocs () {
  request({
    url: 'http://admin:admin@localhost:15984/_users/_design/_auth'
  , json: true
  }, function (err, res, bod) {
    _auth._rev = bod._rev

    request.put({
      url: 'http://admin:admin@localhost:15984/_users/_design/_auth'
    , body: _auth
    , json: true
    }, function (e, resp, b) {
      if (e) {
        console.log({error:e, body:b})
      } else if (resp.statusCode > 199 && resp.statusCode < 300) {
        console.log({success:true})
        // console.log({success:true, resp:resp, body:b})
      } else {
        console.log({error:"status code is not 201.", body:b})
      }

      initCouchDocs.replicateDdocs(replicatePackages);
    })
  })

}


// replicate packages, then when we don't see any
// updates for a full second, do the users.
var userTimer
, didUsers = fs.existsSync(__dirname + '/user_upload_complete.dat')
, didMorePackages = false

function replicatePackages () {
  console.error('replicate packages (around 1/256th of the registry)')
  new Replicator({
    from: 'https://skimdb.npmjs.com/registry',
    to: 'http://admin:admin@localhost:15984/registry',
    filter: filterPackage
  }).push(function () {
    clearTimeout(userTimer)
    if (!didUsers) userTimer = setTimeout(replicateUsers, 1000)
  })
}

var morePackagesTimer
function replicateUsers () {

  var cb = function () {
    if (didMorePackages) return
    clearTimeout(morePackagesTimer)
    morePackagesTimer = setTimeout(morePackages, 1000)
  }

  if (didUsers) return cb()
  didUsers = true
  console.error('replicate users')
  var to = 'http://admin:admin@localhost:15984/_users'
  request.post({
    json: true
  , uri: to + '/_bulk_docs'
  , body: sampleUsers
  }, function (e, resp, b) {
      if (e) {
        console.log({error:e, body:b})
      } else if (resp.statusCode > 199 && resp.statusCode < 300) {
        console.log({success:true, resp:resp, body:b})
        fs.writeFileSync(__dirname + '/user_upload_complete.dat', '');
      } else {
        console.log({error:"status code is not 201.", body:b})
      }

      return cb()
  })

}

// now replicate more packages.  by this time, the site has
// probably started up if you did `npm run dev`, but we can
// back-fill to get more interesting stuff.
var doneTimer
function morePackages () {
  if (didMorePackages) return
  didMorePackages = true
  console.error('even more packages (around 1/16th of the registry)')
  new Replicator({
    from: 'https://skimdb.npmjs.com/registry',
    to: 'http://admin:admin@localhost:15984/registry',
    filter: filterPackageMore
  }).push(function () {
    // this one we just let continue indefinitely.
  })
}

// start it going
replicateDdocs()
