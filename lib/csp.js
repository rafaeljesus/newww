require("dotenv").load()

var cloneDeep = require("lodash").cloneDeep
var csp = module.exports = {}

csp.default = {
  defaultSrc: 'self',
  scriptSrc: [
    'self',
    'https://checkout.stripe.com',
    'https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.2/html5shiv.min.js',
    'https://fonts.googleapis.com',
    'https://forms.hubspot.com/',
    'https://js.hsforms.net/',
    'https://js.stripe.com/v2/',
    'https://js.hs-analytics.net',
    'https://www.google-analytics.com',
  ],
  styleSrc: [
    'self',
    'unsafe-inline',
    'https://fonts.googleapis.com'
  ],
  imgSrc: '*',
  connectSrc: [
    'self',
    'https://typeahead.npmjs.com/',
    'https://partners.npmjs.com/',
    'https://api.github.com',
  ],
  fontSrc: [
    'self',
    'https://fonts.gstatic.com'
  ],
  // objectSrc: Values for the object-src directive,
  // mediaSrc: Values for the media-src directive,
  frameSrc: [
    'https://checkout.stripe.com'
  ],
  // sandbox: Values for the sandbox directive,
  reportUri: '/-/csplog'
}

// Allow extra script sources on enterprise signup pages
csp.enterprise = cloneDeep(csp.default)
csp.enterprise.scriptSrc = csp.enterprise.scriptSrc.concat(
  'https://js.hsforms.net/forms/current.js',
  'https://forms.hubspot.com',
  'https://internal.hubapi.com',
  'https://api.hubapi.com'
);
