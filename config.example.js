var path = require('path'),
    fs = require('fs');

exports.port = 15443;
exports.host = "localhost";
exports.httpPort = 15080;

exports.server = {
  views: {
    engines: {
      hbs: require('handlebars')
    },
    partialsPath: path.resolve(__dirname, 'hbs-partials'),
    helpersPath: path.resolve(__dirname, 'hbs-helpers')
  },
  tls: {
    "ca": [],
    "key": fs.readFileSync('dev/ssl/server.key'),
    "cert": fs.readFileSync('dev/ssl/server.crt')
  },
  cache: {
    engine: require('catbox-redis'),
    host: '127.0.0.1',
    port: '16379',
    password: 'i-am-using-redis-in-development-mode-for-npm-www'
  },
  security: {
    hsts: {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      includeSubdomains: true
    },
    xframe: true
 /* },
  debug: {
    request: ['error']*/
  }
};

exports.couch = {
  "couchAuth": "admin:admin",
  "registryCouch": "http://localhost:15984/"
};

exports.user = {
  profileFields: {
    fullname: [ 'Full Name', '%s' ],
    email: [ 'Email', '<a href="mailto:%s">%s</a>', function (u) {
      return u.protocol === 'mailto:'
    } ],
    github: [ 'GitHub', '<a rel="me" href="https://github.com/%s">%s</a>',
      hostmatch(/^github.com$/) ],
    twitter: [ 'Twitter', '<a rel="me" href="https://twitter.com/%s">@%s</a>',
      hostmatch(/^twitter.com$/) ],
    appdotnet: [ 'App.net', '<a rel="me" href="https://alpha.app.net/%s">%s</a>',
      hostmatch(/app.net$/) ],
    homepage: [ 'Homepage', '<a rel="me" href="%s">%s</a>',
      hostmatch(/[^\.]+\.[^\.]+$/) ],
    freenode: [ 'IRC Handle', '%s' ]
  },
  mail: {
    mailTransportType: null,
    mailTransportSettings: null,
    emailFrom: '"The npm Website Robot" <webmaster@npmjs.org>'
  }
};

exports.session = {
  password: 'i dunno, something secure probably?',
  cookie: 's',
  expiresIn: 14 * 24 * 60 * 60 * 1000 // 2 wks
};

exports.search = {
  url:'http://127.0.0.1:9200/npm',
  perPage: 20
};

exports.payments = {
  "stripe": {
    "secretkey": "secrettestkey",
    "publickey": "publictestkey"
  }
};

exports.metrics = {
  collector: {
    host: 'localhost',
    port: 3333
  },
  prefix: 'npm-www-dev'
}

exports.downloads = {
  url: "https://api.npmjs.org/downloads/"
};

exports.otherStuff = {
  "keys": [
    "these keys are for dev mode only"
  ],
}

function hostmatch (m) { return function (u) {
  return u.host && u.host.match(m)
} }
