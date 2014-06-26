var sanitizer = require('sanitizer'),
    Hapi = require('hapi'),
    log = require('bole')('registry-browse'),
    uuid = require('node-uuid');

var pageSize = 100;
var possibleTypes = ['all', 'keyword', 'author', 'updated', 'depended', 'star', 'userstar'];

module.exports = function (request, reply) {
  var opts = { user: request.auth.credentials };
  var getBrowseData = request.server.methods.getBrowseData;

  // the url will be something like /browse/{type?}/{arg?}/{page}
  var params = request.params.p || '',
      page, type, arg, title;

  // grab the page number, if it's in the url
  page = +request.query.page || 0;

  // now let's get the type and arg, if they're in there
  params = params.split('/');
  type = params.shift() || 'updated'; // grab the first one - that will be the type

  if (possibleTypes.indexOf(type) === -1) {
    opts.errId = uuid.v1();

    opts.errorType = 'browseUrl';
    opts.url = request.server.info.uri + request.url.path;

    log.error(opts.errId + ' ' + Hapi.error.notFound('The requested url is invalid'), opts.url);
    return reply.view('error', opts).code(404);
  }

  if (type !== 'all' && type !== 'updated') {
    arg = params.shift();
  }

  var browseby = type;
  if (arg) {
    arg = sanitizer.sanitize(arg).replace(/<[^\>]+>/g, '').trim();
  }
  if (arg) {
    browseby += '/' + encodeURIComponent(arg);
  }

  var sarg;
  if (arg) {
    sarg = encodeURIComponent(arg);
  }

  var start = page * pageSize,
      limit = pageSize;

  getBrowseData(type, arg, start, limit, function (err, data) {
    if (err) {
      opts.errId = uuid.v1();

      opts.errorType = 'internal';

      log.error(opts.errId + ' ' + Hapi.error.internal('There was an error when getting the browse data'), err);
      return reply.view('error', opts).code(500);
    }

    opts.browse = {
      items: data,
      page: page + 1,
      prevPage: page - 1,
      nextPage: page + 1,
      pageSize: pageSize,
      browseby: browseby,
      type: type,
      arg: type === 'keyword' ? JSON.stringify(sarg) : sarg
    };

    return reply.view('browse', opts);
  });
}