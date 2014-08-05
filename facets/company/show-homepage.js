var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

var commaIt = require('number-grouper'),
    Hapi = require('hapi'),
    log = require('bole')('company-homepage'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();

module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  load(request, function (err, cached) {

    var opts = {
      user: request.auth.credentials,
      title: 'npm',
      updated: cached.updated || [],
      depended: cached.depended || [],
      starred: cached.starred || [],
      authors: cached.authors || [],
      downloads: {
        day: commaIt(cached.downloads.day, {sep: ' '}),
        week: commaIt(cached.downloads.week, {sep: ' '}),
        month: commaIt(cached.downloads.month, {sep: ' '}),
      },
      totalPackages: commaIt(cached.totalPackages, {sep: ' '}),
      hiring: request.server.methods.hiring.getRandomWhosHiring()
    };

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'homepage');

    metrics.addMetric({name: 'homepage'});
    reply.view('index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var browse = request.server.methods.registry.getBrowseData,
      recentAuthors = request.server.methods.registry.getRecentAuthors,
      addMetric = metrics.addMetric,
      downloads = request.server.methods.downloads.getAllDownloads,
      packagesCreated = request.server.methods.registry.packagesCreated;

  var n = 6,
      cached = {};

  browse('star', null, 0, 10, next('starred'));
  browse('depended', null, 0, 10, next('depended'));
  browse('updated', null, 0, 10, next('updated'));
  recentAuthors(TWO_WEEKS, 0, 10, next('authors'));
  downloads(next('downloads'));
  packagesCreated(next('totalPackages'));

  function next (which) {
    return function (err, data) {

      if (err) {
        log.warn(uuid.v1() + ' ' + Hapi.error.internal('download error for ' + which), err);
      }

      cached[which] = data;
      if (--n === 0) {
        return cb(null, cached);
      }
    }
  }
}