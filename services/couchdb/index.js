var SECOND = 1000;

var couchDB = require('./couchDB');

exports.register = function Couch (service, options, next) {

  couchDB.init(options);

  var userMethods = require('./methods/user')(options,service)

  service.method('couch.getPackage', require('./methods/getPackage'), {
    cache: { expiresIn: 60 * SECOND, segment: '##package' }
  });

  service.method('couch.getUser', require('./methods/getUser'), {
    cache: { expiresIn: 60 * SECOND, segment: '##user' }
  });

  service.method('couch.lookupUserByEmail', require('./methods/emailLookup'));

  service.method('couch.getBrowseData', require('./methods/browse'), {
    cache: { expiresIn: 60 * SECOND, segment: '##browse' }
  });

  service.method('couch.getRecentAuthors', require('./methods/recentAuthors'))

  service.method('couch.loginUser', userMethods.login);
  service.method('couch.logoutUser', userMethods.logout);

  service.method('couch.signupUser', require('./methods/signupUser'));

  service.method('couch.saveProfile', require('./methods/saveProfile'));

  service.method('couch.changePass', require('./methods/changePass'));

  service.method('couch.changeEmail', require('./methods/changeEmail')(service));

  service.method('couch.star', require('./methods/stars').star);
  service.method('couch.unstar', require('./methods/stars').unstar);

  service.method('couch.packagesCreated', require('./methods/packagesCreated'), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 10 * SECOND, // refresh after 10 seconds
      segment: '##totalPackages'
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};