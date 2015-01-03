var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

var async = require('async'),
    browse = require('../../services/registry/methods/getBrowseData'),
    Hapi = require('hapi'),
    parseLanguageHeader = require('accept-language-parser').parse,
    fmt = require('util').format,
    moment = require('moment'),
    once = require('once');

module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  load(request, function (err, cached) {

    var opts = {
      user: request.auth.credentials,
      updated: cached.updated || [],
      depended: cached.depended || [],
      starred: cached.starred || [],
      // authors: cached.authors || [],
      downloads: cached.downloads,
      totalPackages: cached.totalPackages,
      explicit: require("../../lib/explicit-installs.json").slice(0,15).map(function(pkg) {
        pkg.installCommand = "npm install " + pkg.name + (pkg.preferGlobal ? " -g" : "")
        pkg.starCount = pkg.users ? Object.keys(pkg.users).length : 0
        pkg.url = "/package/" + pkg.name

        pkg.version = pkg['dist-tags'].latest
        if (pkg.versions) {
          pkg.version = pkg.versions[pkg.version].version
          pkg.publishedBy = pkg.versions[pkg.version]._npmUser
        }
        pkg.lastPublished = moment(pkg.time[pkg.version]).fromNow()
        delete pkg.versions

        // Add logos
        var logos = {
          bower: "https://i.cloudup.com/Ka0R3QvWRs.png",
          browserify: "https://d21ii91i3y6o6h.cloudfront.net/gallery_images/from_proof/1647/small/1405586570/browserify-2-hexagon-sticker.png",
          "coffee-script": "https://cldup.com/kyDqUBuW3k.png",
          cordova: "https://cldup.com/q5Jmvu10tV.png",
          dat: "https://d21ii91i3y6o6h.cloudfront.net/gallery_images/from_proof/1497/large/1403068242/dat-data.png",
          express: "https://cldup.com/wpGXm1cWwB.png",
          forever: "https://cldup.com/iSilAlBYLW.svg",
          gulp: "https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png",
          grunt: "https://i.cloudup.com/bDkmXyEmr5.png",
          "grunt-cli": "https://i.cloudup.com/bDkmXyEmr5.png",
          karma: "https://cldup.com/0286W-2y27.png",
          less: "https://i.cloudup.com/LYSQDzsBKK.png",
          npm: "https://cldup.com/Rg6WLgqccB.svg",
          pm2: "https://cldup.com/PKpktytKH9.png",
          statsd: "https://cldup.com/3s3hGntQAy.svg",
          yo: "https://cldup.com/P3MQgWdDyG.png",
        }

        for (var name in logos) {
          if (name === pkg.name) {
            pkg.logo = logos[name]
          }
        }

        return pkg
      })
    };

    request.timing.page = 'homepage';
    request.metrics.metric({name: 'homepage', value: 1});

    return reply.view('company/index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var redis = request.server.app.cache._cache.connection.client,
    registry = request.server.methods.registry,
    // recentAuthors = registry.getRecentAuthors,
    downloads = request.server.methods.downloads.getAllDownloads,
    cached = {};

  async.parallel([
    function(cb) { cbWithTimeout('depended', cachedBrowse, ['depended', redis, false, 0, 12], cached, cb); },
    function(cb) { cbWithTimeout('updated', cachedBrowse, ['updated', redis, false, 0, 12], cached, cb); },
    function(cb) { cbWithTimeout('downloads', downloads, [], cached, cb); },
    function(cb) { cbWithTimeout('totalPackages', registry.packagesCreated, [], cached, cb); }
  ], function(err) {
    if (err) request.logger.warn(Hapi.error.internal('download error'), err);
    return cb(null, cached);
  });


  // perform browse, caching the results in redis with a TTL.
  function cachedBrowse(browseMethod, redis, arg, skip, limit, cb) {
    var key = 'show-homepage:' + browseMethod,
      ttl = 300; // 5 minute cache.

    redis.get(key, function(err, value) {
      var cached = null;

      try {
        if (value) cached = JSON.parse(value);
      } catch (e) {
        // if we cache bad JSON data, it will
        // fall out of the cache within the TTL.
      }

      if (cached) {
        return cb(null, cached);
      } else {
        browse(browseMethod, false, skip, limit, function(err, data) {
          if (data) {
            redis.setex(key, ttl, JSON.stringify(data), function() {
              request.logger.info('wrote ' + browseMethod + ' view to redis cache.');
            });
          }
          return cb(err, data);
        });
      }
    });
  }

  function cbWithTimeout(which, method, args, cached, cb) {
    var timeout = process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT) : 3000; // maximum execution time when loading data.

    cb = once(cb); // make it so CB can only be executed once.

    args.push(function(err, data) {
      if (err) request.logger.warn(Hapi.error.internal('download error for ' + which), err);
      if (data) cached[which] = data;
      return cb();
    });

    setTimeout(function() {
      if (!cb.called) request.logger.warn(Hapi.error.internal('timeout loading ' + which));
      return cb();
    }, timeout);

    method.apply(this, args); // actually execute the method passed in.
  }
}
