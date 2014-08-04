var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    SECOND = 1000;

var timer = {};

exports.register = function Downloads (service, options, next) {

  service.method('downloads.getDownloadsForPackage', require('./methods/getDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloads'
    }
  });

  service.method('downloads.getAllDownloadsForPackage', require('./methods/getAllDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloadsall'
    }
  });

  service.method('downloads.getAllDownloads', require('./methods/getAllDownloads')(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##alldownloads'
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};


