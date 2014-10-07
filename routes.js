var config = require('./config');
var ops = require('./facets/ops');

var forceAuthConfig = function (handler) {
  return {
    handler: handler,
    auth: {
      mode: 'required'
    },
    plugins: { 'hapi-auth-cookie': {
      redirectTo: '/login'
    }}
  };
};

var routes = module.exports = [

  // === COMPANY ===

  {
    path: '/favicon.ico',
    method: 'GET',
    handler: { file: './favicon.ico' }
  },

  {
    path: '/static/{path*}',
    method: 'GET',
    handler: {
      directory: {
        path: './static',
        listing: false,
        index: false
      }
    }
  },

  {
    path: "/",
    method: "GET",
    handler: require('./facets/company/show-homepage')
  },

  {
    path: "/about",
    method: "GET",
    handler: require('./facets/company/show-about')(config.company)
  },

  {
    path: "/policies/{policy}",
    method: "GET",
    handler: require('./facets/company/show-policy')
  },

  {
    path: "/whoshiring",
    method: "GET",
    handler: require('./facets/company/show-whoshiring')
  },

  {
    path: "/joinwhoshiring",
    method: "GET",
    config: {
      handler: require('./facets/company/show-whoshiring-payments')(config.company.stripe),
      plugins: {
        blankie: {
          scriptSrc: ['self', 'unsafe-eval', 'https://ssl.google-analytics.com', 'https://checkout.stripe.com'],
          frameSrc: 'https://checkout.stripe.com'
        }
      }
    }
  },

  {
    path: "/joinwhoshiring",
    method: "POST",
    handler: require('./facets/company/show-whoshiring-payments')(config.company.stripe)
  },

  {
    path: "/npme-beta",
    method: "GET",
    config: {
      handler: require('./facets/company/show-npme-beta'),
      plugins: {
        blankie: {
          scriptSrc: ['self', 'unsafe-eval', 'https://ssl.google-analytics.com', 'https://js.hs-analytics.net', 'https://js.hsforms.net/forms/current.js', 'https://forms.hubspot.com', 'https://internal.hubapi.com', 'https://api.hubapi.com']
        }
      }
    }
  },

  {
    path: "/npme-beta-thanks",
    method: "GET",
    handler: require('./facets/company/show-npme-beta')
  },

  // === REGISTRY ===

  {
    path: "/package/{package}/{version?}",
    method: "GET",
    handler: require('./facets/registry/show-package')
  },

  {
    path: "/packages/{package}",
    method: "GET",
    handler: function (request, reply) {
      return reply.redirect("/package/" + request.params.package).code(301);
    }
  },

  {
    path: "/browse/{p*}",
    method: "GET",
    handler: require('./facets/registry/show-browse')
  },

  {
    path: "/keyword/{kw}",
    method: "GET",
    handler: function (request, reply) {
      return reply.redirect('/browse/keyword/' + request.params.kw).code(301);
    }
  },

  {
    path: "/recent-authors/{since?}",
    method: "GET",
    handler: require('./facets/registry/show-recent-authors')
  },

  {
    path: "/star",
    method: "POST",
    config: {
      handler: require('./facets/registry/show-star'),
      plugins: {
        crumb: {
          source: 'payload',
          restful: true
        }
      }
    }
  },

  {
    path: "/star",
    method: "GET",
    config: {
      handler: require('./facets/registry/show-star'),
      auth: {
        mode: 'required'
      },
      plugins: { 'hapi-auth-cookie': {
        redirectTo: '/login'
      }}
    }
  },

  {
    path: "/search",
    method: "GET",
    handler: require('./facets/registry/show-search')(config.search)
  },

  // === USER ===

  {
    path: "/~",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-profile')(config.user.profileFields))
  },

  {
    path: "/profile",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-profile')(config.user.profileFields))
  },

  {
    path: "/~{name}",
    method: "GET",
    handler: require('./facets/user/show-profile')(config.user.profileFields)
  },

  {
    path: "/profile/{name}",
    method: "GET",
    handler: require('./facets/user/show-profile')(config.user.profileFields)
  },

  {
    path: "/~/{name}",
    method: "GET",
    handler: require('./facets/user/show-profile')(config.user.profileFields)
  },

  {
    path: "/signup",
    method: "GET",
    handler: require('./facets/user/show-signup')
  },

  {
    path: "/signup",
    method: "HEAD",
    handler: require('./facets/user/show-signup')
  },

  {
    path: "/signup",
    method: "POST",
    handler: require('./facets/user/show-signup')
  },

  {
    path: "/profile-edit",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-profile-edit')(config.user.profileFields))
  },

  {
    path: "/profile-edit",
    method: "HEAD",
    config: forceAuthConfig(require('./facets/user/show-profile-edit')(config.user.profileFields))
  },

  {
    path: "/profile-edit",
    method: "PUT",
    config: forceAuthConfig(require('./facets/user/show-profile-edit')(config.user.profileFields))
  },

  {
    path: "/profile-edit",
    method: "POST",
    config: forceAuthConfig(require('./facets/user/show-profile-edit')(config.user.profileFields))
  },

  {
    path: "/email-edit",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/email-edit",
    method: "HEAD",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/email-edit",
    method: "PUT",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/email-edit",
    method: "POST",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/email-edit/{token*2}",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/email-edit/{token*2}",
    method: "HEAD",
    config: forceAuthConfig(require('./facets/user/show-email-edit')(config.user.mail))
  },

  {
    path: "/login",
    method: "GET",
    handler: require('./facets/user/show-login')
  },


  {
    path: "/login",
    method: "POST",
    handler: require('./facets/user/show-login')
  },

  {
    path: "/logout",
    method: "GET",
    handler: require('./facets/user/show-logout')
  },

  {
    path: "/password",
    method: "GET",
    config: forceAuthConfig(require('./facets/user/show-password'))
  },

  {
    path: "/password",
    method: "HEAD",
    config: forceAuthConfig(require('./facets/user/show-password'))
  },

  {
    path: "/password",
    method: "POST",
    config: forceAuthConfig(require('./facets/user/show-password'))
  },

  {
    path: "/forgot/{token?}",
    method: "GET",
    handler: require('./facets/user/show-forgot')(config.user.mail)
  },

  {
    path: "/forgot/{token?}",
    method: "HEAD",
    handler: require('./facets/user/show-forgot')(config.user.mail)
  },

  {
    path: "/forgot/{token?}",
    method: "POST",
    handler: require('./facets/user/show-forgot')(config.user.mail)
  },

  // === OPS ===

  {
    path: "/ping",
    method: "GET",
    handler: ops.ping
  },

  {
    path: "/status",
    method: "GET",
    handler: ops.status(require('./package.json').version)
  },

  {
    path: "/-/csplog",
    method: "POST",
    handler: ops.csplog
  },

  {
    method: '*',
    path: '/doc/{p*}',
    handler: function (request, reply) {
      return reply.redirect(require("url").format({
        protocol: "https",
        hostname: "docs.npmjs.com",
        pathname: request.url.path
          .replace(/^\/doc/, "")
          .replace(/\.html$/, "")
          .replace(/\/npm-/, "/")
      })).code(301)
    }
  },

  {
    method: '*',
    path: '/{p*}',
    handler: fallback
  }

];

function fallback (request, reply) {
  var route = request.params.p,
      opts = {
        user: request.auth.credentials,
        hiring: request.server.methods.hiring.getRandomWhosHiring()
      };
      // timer = { start: Date.now() };

  request.server.methods.static.getPage(route, function (err, content) {

    if (content) {
      opts.content = content;
      return reply.view('layouts/default', opts, {layout: false});
    }

    request.server.methods.registry.getPackage(route, function (err, package) {

      if (package && !package.error) {
        return reply.redirect('/package/' + package._id);
      }

      return reply.view('registry/notfound', opts).code(404);
    });
  });
}
