var _ = require("lodash")
var public = require("./public");
var authenticated = require("./authenticated");
var routes = [];

public.forEach(function(route){

  // If route defines an array of paths,
  // register each as an individual route
  if (route.paths) {
    route.paths.forEach(function(path){
      var r = _.cloneDeep(route)
      delete r.paths
      r.path = path
      routes.push(r)
    })
  } else {
    routes.push(route);
  }
});

module.exports = routes;
