var _ = require("lodash")
var publicRoutes = require("./public");
var authenticated = require("./authenticated");
var routes = [];

publicRoutes.concat(authenticated).forEach(function(route) {

  // If route defines an array of paths,
  // register each as an individual route
  if (route.paths) {
    route.paths.forEach(function(path) {
      var r = _.cloneDeep(route)
      delete r.paths
      r.path = path
      routes.push(r)
    })
  } else {
    routes.push(route);
  }
});

// Convenience method for tests
routes.at = function(name) {
  return _.find(this, function(route) {
    return name === route.method + " " + route.path
  })
}

module.exports = routes;
