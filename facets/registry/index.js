var path = require('path');
var internals = {};

exports.register = function Regsitry (facet, options, next) {

  facet.views({
    engines: { hbs: 'handlebars' },
    path: path.resolve(__dirname, 'templates')
  });

  facet.route({
    path: "/package/{package}",
    method: "GET",
    handler: require('./show-package')
  });
  
  facet.route({ 
    path:"/search", 
    method: "GET", 
    handler: require('./show-search')
  });  
  next();
}
