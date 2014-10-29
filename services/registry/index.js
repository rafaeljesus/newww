var SECOND = 1000,
    MINUTE = 60 * SECOND;

function setCache (name, minutes) {
  return {
    expiresIn: (minutes || 1) * MINUTE,
    segment: '##' + name
  };
};

exports.register = function Registry (service, options, next) {

  service.method([
    {
      name: 'registry.getBrowseData',
      fn: require('./methods/browse'),
      options: { cache: setCache('browse') }
    },
    {
      name: 'registry.getPackage',
      fn: require('./methods/getPackage'),
      options: { cache: setCache('package') }
    },
    {
      name: 'registry.getAllPackages',
      fn: require('./methods/getAllPackages'),
      options: { cache: setCache('allPackages') }
    },
    {
      name: 'registry.getAllByKeyword',
      fn: require('./methods/getAllByKeyword'),
      options: { cache: setCache('byKeyword') }
    },
    {
      name: 'registry.getAuthors',
      fn: require('./methods/getAuthors'),
      options: { cache: setCache('byAuthor') }
    },
    {
      name: 'registry.getDependedUpon',
      fn: require('./methods/getDependedUpon'),
      options: { cache: setCache('depended', 10) }
    },
    {
      name: 'registry.getStarredPackages',
      fn: require('./methods/getStarredPackages'),
      options: { cache: setCache('browseStar', 10) }
    },
    {
      name: 'registry.getUserStars',
      fn: require('./methods/getUserStars'),
      options: { cache: setCache('userStars') }
    },
    {
      name: 'registry.getUpdated',
      fn: require('./methods/getUpdated'),
      options: { cache: setCache('updated') }
    },

    {
      name: 'registry.getRecentAuthors',
      fn: require('./methods/getRecentAuthors'),
      options: { cache: setCache('authors') }
    }
  ]);


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