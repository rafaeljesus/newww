exports.bob = {
  name: 'bob',
  email: 'bob@boom.me',
  email_verified: true,
  verification_key: '12345',
  resource: {
    fullname: "Bob Henderson",
    github: 'bob',
    twitter: 'twob',
    homepage: 'http://boom.me',
    freenode: 'bobob'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.bcoe = {
  "name": "bcoe",
  "email": "ben@npmjs.com",
  "email_verified": null,
  "verification_key": "d90f1481-387d-4f20-9e38-7073acd84510",
  "created": "2014-11-21T19:50:33.098Z",
  "updated": "2015-03-20T22:33:07.493Z",
  "deleted": null
}

exports.ralph_the_reader = {
  name: 'ralph_the_reader',
  email: 'ralph@reader.com',
  email_verified: null,
  verification_key: '12345',
  resource: {},
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.wrigley_the_writer = {
  name: 'wrigley_the_writer',
  email: 'wrigley@writer.com',
  email_verified: null,
  verification_key: '12345',
  resource: {},
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.profileUpdate = {
  fullname: 'Big Bob',
  github: 'bob',
  twitter: 'bobby'
};

exports.bobUpdateBody = {
  name: 'bob',
  email: 'bob@boom.me',
  email_verified: true,
  verification_key: '12345',
  resource: {
    github: 'bob',
    twitter: 'bobby',
    homepage: 'http://boom.me',
    freenode: 'bobob',
    fullname: 'Big Bob'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null,
  emailObfuscated: '%62%6f%62%40%62%6f%6f%6d%2e%6d%65',
  avatar: {
    small: 'https://secure.gravatar.com/avatar/5cf1283a6c89c584954971789eda3656?size=50&default=retro',
    medium: 'https://secure.gravatar.com/avatar/5cf1283a6c89c584954971789eda3656?size=100&default=retro',
    large: 'https://secure.gravatar.com/avatar/5cf1283a6c89c584954971789eda3656?size=496&default=retro'
  }
};

exports.bobUpdated = {
  name: 'bob',
  email: 'bob@boom.me',
  email_verified: true,
  verification_key: '12345',
  resource: {
    fullname: 'Big Bob',
    github: 'bob',
    twitter: 'bobby',
    homepage: '',
    freenode: '',
    mustChangePass: 'true'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.changePass = {
  current: '12345',
  new: 'abcde',
  verify: 'abcde'
};

exports.mikeal = {
  name: 'mikeal',
  email: 'mikeal@president-of-javascript.com',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'mikeal',
    twitter: 'mikeal',
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.diana_delinquent = {
  name: 'diana_delinquent',
  email: 'diana@late.fee',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'diana_delinquent',
    twitter: 'diana',
    homepage: 'http://diana.com'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.norbert_newbie = {
  name: 'norbert_newbie',
  email: 'norbert@newbies.com',
  email_verified: true,
  resource: {
    github: 'norbs',
    twitter: 'norbington',
    homepage: 'http://norbert.name'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.uncle_unverified = {
  name: 'uncle_unverified',
  email: 'uncle@unverified.com',
  email_verified: null
};

exports.no_email = {
  name: 'early_user',
  email_verified: null,
  verification_key: '12345',
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.bad_email = {
  name: 'lolbademail',
  email: 'lolbad@email',
  email_verified: null,
  verification_key: '12345',
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.npmEmployee = {
  name: 'seldo',
  email: 'seldo@npmjs.com',
  email_verified: null,
  verification_key: '12345',
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.changePass = {
  current: '12345',
  new: 'abcde',
  verify: 'abcde'
};

exports.stars = [
  "jade",
  "johnny-five",
  "npm",
  "vektor"
];

exports.packages = require("./user_packages")
