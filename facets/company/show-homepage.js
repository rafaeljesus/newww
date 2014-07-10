var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

var commaIt = require('number-grouper');

module.exports = function (request, reply) {

  load(request, function (err, cached) {

    var opts = {
      user: request.auth.credentials,
      title: 'npm',
      updated: cached.updated || [],
      depended: cached.depended || [],
      starred: cached.starred || [],
      authors: cached.authors || [],
      downloads: {
        day: commaIt(cached.dlDay, {sep: ' '}),
        week: commaIt(cached.dlWeek, {sep: ' '}),
        month: commaIt(cached.dlMonth, {sep: ' '}),
      },
      totalPackages: commaIt(cached.totalPackages, {sep: ' '}),
      hiring: request.server.methods.getRandomWhosHiring()
    };

    request.server.methods.addMetric({name: 'homepage'});
    reply.view('index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var browse = request.server.methods.getBrowseData,
      recentAuthors = request.server.methods.getRecentAuthors,
      addMetric = request.server.methods.addMetric,
      downloads = request.server.methods.getAllDownloads,
      packagesCreated = request.server.methods.packagesCreated;

  var n = 8,
      cached = {},
      timer = {};

  browse('star', null, 0, 10, next('starred'));
  browse('depended', null, 0, 10, next('depended'));
  browse('updated', null, 0, 10, next('updated'));
  recentAuthors(TWO_WEEKS, 0, 10, next('authors'));
  downloads('last-day', 'point', next('dlDay'));
  downloads('last-week', 'point', next('dlWeek'));
  downloads('last-month', 'point', next('dlMonth'));
  packagesCreated(next('totalPackages'));

  function next (which) {
    timer.start = Date.now();
    return function (err, data) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        browse: which
      });

      cached[which] = data;
      if (--n === 0) {
        return cb(null, cached);
      }
    }
  }
}