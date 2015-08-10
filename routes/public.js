var fmt = require('util').format;
var fs = require('fs');
var _ = require('lodash');
var async = require('async');

var unathenticatedRouteConfig = {
  config: {
    auth: {
      mode: 'try'
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false
      }
    }
  }
};

var ajaxy = {
  plugins: {
    crumb: {
      source: 'payload',
      restful: true
    }
  }
};

var publicRoutes = [
  {
    path: '/static/js/index.js',
    method: 'GET',
    handler: {
      file: 'static/js/index.js'
    }
  }, {
    path: '/static/{path*}',
    method: 'GET',
    handler: {
      directory: {
        path: './static'
      }
    },
    config: {
      cache: {
        expiresIn: 7 * 24 * 60 * 60 * 1000
      }
    }
  }, {
    path: "/",
    method: "GET",
    handler: require('../handlers/homepage')
  }, {
    path: "/private-npm",
    method: "GET",
    handler: function(request, reply) {
      return reply.redirect("/private-modules").code(301);
    }
  }, {
    path: "/orgs",
    method: "GET",
    handler: function(request, reply) {
      return reply.redirect("http://info.npmjs.com/test-orgs").code(301);
    }
  }, {
    path: "/contact",
    method: "GET",
    handler: require('../facets/company/show-contact')
  }, {
    path: "/send-contact",
    method: "POST",
    handler: require('../facets/company/show-send-contact')
  }, {
    path: "/support",
    method: "GET",
    handler: require('../facets/company/show-contact')
  }, {
    path: "/policies/{policy?}",
    method: "GET",
    handler: require('../facets/company/show-policy')
  }, {
    path: "/whoshiring",
    method: "GET",
    handler: require('../facets/company/show-whoshiring')
  }, {
    path: "/joinwhoshiring",
    method: "GET",
    handler: require('../facets/company/show-whoshiring-payments')
  }, {
    path: "/joinwhoshiring",
    method: "POST",
    handler: require('../facets/company/show-whoshiring-payments'),
    config: ajaxy
  }, {
    path: "/enterprise",
    method: "GET",
    handler: require('../facets/enterprise/show-index')
  }, {
    path: "/enterprise-start-signup",
    method: "POST",
    handler: require('../facets/enterprise/show-ula')
  }, {
    path: "/enterprise-contact-me",
    method: "POST",
    handler: require('../facets/enterprise/show-contact-me')
  }, {
    path: "/enterprise-trial-signup",
    method: "POST",
    handler: require('../facets/enterprise/show-trial-signup')
  }, {
    path: "/enterprise-verify",
    method: "GET",
    handler: require('../facets/enterprise/show-verification')
  }, {
    path: "/enterprise/license",
    method: ["GET", "POST"],
    handler: require('../facets/enterprise/find-license'),
  }, {
    path: "/enterprise/license-options",
    method: "GET",
    handler: require('../facets/enterprise/license-options'),
  }, {
    path: "/enterprise/buy-license",
    method: "POST",
    handler: require('../facets/enterprise/buy-license'),
    config: ajaxy
  }, {
    path: "/enterprise/license-paid",
    method: "GET",
    handler: require('../facets/enterprise/license-paid')
  }, {
    path: "/enterprise/license-error",
    method: "GET",
    handler: require('../facets/enterprise/license-error')
  }, {
    paths: [
      "/package/{package}/collaborators",
      "/package/{scope}/{project}/collaborators",
    ],
    method: "GET",
    handler: require('../handlers/collaborator').list
  }, {
    paths: [
      "/package/{package}",
      "/package/{scope}/{project}",
    ],
    method: "GET",
    handler: require('../handlers/package').show
  }, {
    // redirect plural forms to singular
    paths: [
      "/packages/{package}",
      "/packages/{scope}/{project}",
    ],
    method: "GET",
    handler: function(request, reply) {
      if (request.params.scope) {
        return reply.redirect("/package/" + request.params.scope + "/" + request.params.project).code(301);
      } else {
        return reply.redirect("/package/" + request.params.package).code(301);
      }
    }
  }, {
    paths: [
      "/package/{package}/access",
      "/package/{scope}/{project}/access",
    ],
    method: "GET",
    handler: require('../handlers/access')
  }, {
    path: "/browse/author/{user}",
    method: "GET",
    handler: function(request, reply) {
      return reply.redirect(fmt("/~%s#packages", request.params.user)).code(301);
    }
  }, {
    path: "/browse/userstar/{user}",
    method: "GET",
    handler: function(request, reply) {
      return reply.redirect(fmt("/~%s#starred", request.params.user)).code(301);
    }
  }, {
    paths: [
      "/browse/all",
      "/recent-authors/{since?}",
      "/browse/userstar",
      "/browse/keyword",
    ],
    method: "GET",
    handler: function(request, reply) {
      return reply.redirect("/").code(301);
    }
  }, {
    path: "/browse/keyword/{keyword}",
    method: "GET",
    handler: require('../handlers/browse').packagesByKeyword
  }, {
    path: "/browse/depended",
    method: "GET",
    handler: require('../handlers/browse').mostDependedUponPackages
  }, {
    path: "/browse/depended/{package}",
    method: "GET",
    handler: require('../handlers/browse').packageDependents
  }, {
    path: "/browse/star",
    method: "GET",
    handler: require('../handlers/browse').mostStarredPackages
  }, {
    path: "/browse/updated",
    method: "GET",
    handler: require('../handlers/browse').recentlyUpdatedPackages
  }, {
    path: "/browse/created",
    method: "GET",
    handler: require('../handlers/browse').recentlyCreatedPackages
  }, {
    path: "/star",
    method: "POST",
    handler: require('../handlers/star'),
    config: ajaxy
  }, {
    path: "/search/{q?}",
    method: "GET",
    handler: require('../facets/registry/show-search')
  }, {
    paths: [
      "/~{name}",
      "/profile/{name}",
      "/~/{name}"
    ],
    method: "GET",
    handler: require('../facets/user/show-profile')
  }, {
    path: "/profile/{name}/packages",
    method: "GET",
    handler: require('../facets/user/show-packages')
  }, {
    path: "/signup",
    method: "GET",
    handler: require('../facets/user/show-signup')
  }, {
    path: "/signup",
    method: "POST",
    handler: require('../facets/user/show-signup')
  }, {
    path: "/confirm-email/{token?}",
    method: "GET",
    handler: require('../facets/user/show-confirm-email')
  }, {
    path: "/login",
    method: "GET",
    handler: require('../facets/user/show-login')
  }, {
    path: "/login",
    method: "POST",
    handler: require('../facets/user/show-login')
  }, {
    path: "/logout",
    method: "POST",
    handler: require('../facets/user/show-logout')
  }, {
    path: "/forgot/{token?}",
    method: "GET",
    handler: require('../facets/user/show-forgot')
  }, {
    path: "/forgot/{token?}",
    method: "POST",
    handler: require('../facets/user/show-forgot')
  }, {
    path: "/_monitor/ping",
    method: "GET",
    handler: function(request, reply) {
      return reply('ok').code(200);
    }
  }, {
    path: "/_monitor/status",
    method: "GET",
    handler: require('../handlers/ops').status(require('../package.json').version)
  }, {
    path: "/-/csplog",
    method: "POST",
    handler: require('../handlers/ops').csplog,
    config: {
      plugins: {
        crumb: false
      }
    }
  }, {
    method: '*',
    path: '/doc/{p*}',
    handler: function(request, reply) {
      return reply.redirect(require("url").format({
        protocol: "https",
        hostname: "docs.npmjs.com",
        pathname: request.url.path
          .replace(/^\/doc/, "")
          .replace(/\.html$/, "")
          .replace(/\/npm-/, "/")
      })).code(301);
    }
  }, {
    method: '*',
    path: '/private-modules',
    handler: function(request, reply) {
      var route = request.path.substr(1, request.path.length);
      var loggedInUser = request.loggedInUser;
      var isPaid = loggedInUser && loggedInUser.isPaid;
      var opts = { };
      opts.isPaid = isPaid;

      var actions = {
        privateModules: function(cb) {
          request.server.methods.corp.getPage(route, function(er, content) {
            if (er) {
              cb(er);
            } else if (content) {
              cb(null, content);
            }
          });
        },
        privateModulesBenefits: function(cb) {
          request.server.methods.corp.getPage('private-modules-benefits', function(er, content) {
            if (er) {
              cb(er);
            } else if (content) {
              cb(null, content);
            }
          });
        }
      };
      async.parallel(actions, function(err, results) {
        opts.md = results.privateModules;
        opts.benefits = results.privateModulesBenefits;
        return reply.view('company/private-modules', opts);
      });

    }
  }, {
    method: '*',
    path: '/{p*}',
    handler: require("../handlers/fallback")
  }

];

// Allow files in /static/misc to be web-accessible from /
fs.readdirSync("./static/misc").forEach(function(filename) {
  publicRoutes.push({
    path: '/' + filename,
    method: 'GET',
    handler: {
      file: './static/misc/' + filename
    }
  });
});

publicRoutes = publicRoutes.map(function(route) {
  return _.merge({}, unathenticatedRouteConfig, route);
});

module.exports = publicRoutes;
