var csp = module.exports = {}

csp.default = {
  defaultSrc: 'self',
  scriptSrc: [
    'self',

    'https://forms.hubspot.com/uploads/form/v2/419727/9a2b4ac5-ef09-43e6-854a-d82c92347c9d',
    'https://forms.hubspot.com/uploads/form/v2/419727/6672f0d7-d2df-4696-a164-a8fa139d8f15',
    'https://forms.hubspot.com/uploads/form/v2/419727/64c6e95b-b2c7-4989-a8ae-d967645e5198',
    'https://forms.hubspot.com/uploads/form/v2/419727/d9ba17d5-606e-456d-a703-733c67f5e708',
    'https://js.hsforms.net/forms/current.js',
    'https://api.hubapi.com',
    'https://internal.hubapi.com',
    'https://js.hs-analytics.net',

    'https://api.stripe.com',
    'https://checkout.stripe.com/checkout.js',
    'https://js.stripe.com/v2/',

    'https://www.google-analytics.com',
    'https://fonts.googleapis.com',
    'https://s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js',
    'https://npmjs.us9.list-manage.com',
    'https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.2/html5shiv.min.js',
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
