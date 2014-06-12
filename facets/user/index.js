var path = require('path')

exports.register = function User (facet, options, next) {
  facet.views({
    engines: { hbs: require('handlebars') },
    path: path.resolve(__dirname, 'templates')
  });

  facet.route([
    {path: "/~", method: "GET", handler: require('./show-profile')(options.profileFields) },
    {path: "/profile", method: "GET", handler: require('./show-profile')(options.profileFields) }
  ]);

  facet.route([
    { path: "/~{name}", method: "GET", handler: require('./show-profile')(options.profileFields) },
    { path: "/profile/{name}", method: "GET", handler: require('./show-profile')(options.profileFields) },
    { path: "/~/{name}", method: "GET", handler: require('./show-profile')(options.profileFields) }
  ]);

  facet.route({
    path: "/signup",
    method: ["GET", "HEAD", "POST"],
    handler: require('./show-signup')
  });

  facet.route({
    path: "/profile-edit",
    method: ["GET", "HEAD", "PUT", "POST"],
    config: {
      handler: require('./show-profile-edit'),
      auth: {
        mode: 'required'
      },
      plugins: { 'hapi-auth-cookie': {
        redirectTo: '/login'
      }}
    }
  });

  facet.route({
    path: "/login",
    method: ["GET", "POST"],
    handler: require('./login')
  });

  facet.route({
    path: "/logout",
    method: "GET",
    handler: function (request, reply) {
      request.auth.session.clear();
      return reply().redirect('/');
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};