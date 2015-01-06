var Hapi = require('hapi'),
    request = require('request'),
    SECOND = 1000;

var timer = {};

exports.register = function Downloads (server, options, next) {

  server.method('downloads.getDownloadsForPackage', require('./methods/getDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloads'
    }
  });

  server.method('downloads.getAllDownloadsForPackage', require('./methods/getAllDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloadsall'
    }
  });

  server.method('downloads.getAllDownloads', require('./methods/getAllDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##alldownloads'
    }
  });

  return next();
};

exports.register.attributes = {
  "name": "newww-service-downloads",
  "version": "0.0.1",
};
