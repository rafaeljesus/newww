var _ = require("lodash");
var publicRoutes = require("./public");
var authenticated = require("./authenticated");
var feature = require('../lib/feature-flags');

var routes = publicRoutes.concat(authenticated).filter(function(route) {
  if (route.feature) {
    return [].concat(route.feature).some(function(feat) {
      if (feat[0] == '!') {
        return !feature(feat.slice(1));
      } else {
        return feature(feat);
      }
    });
  } else {
    return true;
  }
}).reduce(function(routes, route) {

  delete route.feature;

  // If route defines an array of paths,
  // register each as an individual route
  if (route.paths) {
    route.paths.forEach(function(path) {
      var r = _.cloneDeep(route);
      delete r.paths;
      r.path = path;
      routes.push(r);
    });
  } else {
    routes.push(route);
  }

  return routes;
}, []);

// Convenience method for tests
routes.at = function(name) {
  return _.find(this, function(route) {
    return name === route.method + " " + route.path;
  });
};

module.exports = routes;
