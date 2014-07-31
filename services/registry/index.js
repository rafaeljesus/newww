var SECOND = 1000;

exports.register = function Registry (service, options, next) {

  service.method('registry.getPackage', require('./methods/getPackage'), {
    cache: { expiresIn: 60 * SECOND, segment: '##package' }
  });

  service.method('registry.getBrowseData', require('./methods/browse'), {
    cache: { expiresIn: 60 * SECOND, segment: '##browse' }
  });

  service.method('registry.getRecentAuthors', require('./methods/recentAuthors'));

  service.method('registry.star', require('./methods/stars').star);
  service.method('registry.unstar', require('./methods/stars').unstar);

  service.method('registry.packagesCreated', require('./methods/packagesCreated'), {
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