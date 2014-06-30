var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

module.exports = function (request, reply) {
  load(request, function (err, cached) {
    var opts = {
      user: request.auth.credentials,
      title: 'npm',
      updated: cached.updated || [],
      depended: cached.depended || [],
      starred: cached.starred || [],
      authors: cached.authors || []
    };

    reply.view('index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var browse = request.server.methods.getBrowseData,
      recentAuthors = request.server.methods.getRecentAuthors;

  var n = 4,
      cached = {};

  browse('star', null, 0, 10, next('starred'));
  browse('depended', null, 0, 10, next('depended'));
  recentAuthors(TWO_WEEKS, 0, 10, next('authors'));
  browse('updated', null, 0, 10, next('updated'));

  function next (which) {
    return function (err, data) {
      cached[which] = data;
      if (--n === 0) {
        return cb(null, cached);
      }
    }
  }
}