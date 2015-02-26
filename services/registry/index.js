var SECOND = 1000,
    MINUTE = 60 * SECOND;

function setCache (name, minutes) {
  return {
    expiresIn: (minutes || 1) * MINUTE,
    segment: '##' + name
  };
}

exports.register = function Registry (server, options, next) {

  server.method([
    {
      name: 'registry.getBrowseData',
      method: require('./methods/getBrowseData'),
      options: { cache: setCache('browse', 10) }
    },
    {
      name: 'registry.getPackage',
      method: require('./methods/getPackage'),
      options: { cache: setCache('package') }
    },
    {
      name: 'registry.getAllPackages',
      method: require('./methods/getAllPackages'),
      options: { cache: setCache('allPackages', 5) }
    },
    {
      name: 'registry.getAllByKeyword',
      method: require('./methods/getAllByKeyword'),
      options: { cache: setCache('byKeyword') }
    },
    {
      name: 'registry.getAuthors',
      method: require('./methods/getAuthors'),
      options: { cache: setCache('byAuthor') }
    },
    {
      name: 'registry.getDependedUpon',
      method: require('./methods/getDependedUpon'),
      options: { cache: setCache('depended', 10) }
    },
    {
      name: 'registry.getStarredPackages',
      method: require('./methods/getStarredPackages'),
      options: { cache: setCache('browseStar', 10) }
    },
    {
      name: 'registry.getUserStars',
      method: require('./methods/getUserStars'),
      options: { cache: setCache('userStars') }
    },
    {
      name: 'registry.getUpdated',
      method: require('./methods/getUpdated'),
      options: { cache: setCache('updated') }
    },
  ]);


  server.method('registry.star', require('./methods/stars').star);
  server.method('registry.unstar', require('./methods/stars').unstar);

  server.method('registry.packagesCreated', require('./methods/packagesCreated'), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 10 * SECOND, // refresh after 10 seconds
      segment: '##totalPackages'
    }
  });

  return next();
};

exports.register.attributes = {
  "name": "newww-service-registry",
  "version": "0.0.1",
};
