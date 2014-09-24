var config = require('./config');

var routes = module.exports = [
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
    path: "/whoshiring",
    method: "GET",
    handler: require('./facets/company/show-whoshiring')
  },

  {
    path: "/joinwhoshiring",
    method: ["GET", "POST"],
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
];
