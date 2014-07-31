var path = require('path'),
    fs = require('fs'),
    os = require('os');

exports.port = 15443;
exports.host = "localhost";

// uncomment this line if you want to run `npm start` inside the VM
// fair warning: it might take a bit to get started, but it *will* work
// exports.host = "0.0.0.0";

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

// stamp data for templates
var gitHead;
try {
  gitHead = fs.readFileSync('.git/HEAD', 'utf8').trim()
  if (gitHead.match(/^ref: /)) {
    gitHead = gitHead.replace(/^ref: /, '').trim()
    gitHead = fs.readFileSync('.git/' + gitHead, 'utf8').trim()
  }
  exports.HEAD = gitHead
} catch (_) {
  gitHead = '(not a git repo) ' + _.message
}

exports.stamp = 'pid=' + process.pid + ' ' +
                // 'worker=' + cluster.worker.id + ' ' +
                gitHead + ' ' + exports.host +
                ' ' + os.hostname() + ' ' + process.env.SMF_ZONENAME;

// ===== service options =====
exports.couch = {
  "couchAuth": "admin:admin",
  "registryCouch": "http://localhost:15984/"
};

exports.session = {
  password: 'i dunno, something secure probably?',
  cookie: 's',
  expiresIn: 14 * 24 * 60 * 60 * 1000 // 2 wks
};

exports.metrics = {
  collector: {
    host: 'localhost',
    port: 3333,
    udp: true
  },
  prefix: 'npm-www-dev'
}

exports.downloads = {
  url: "https://api.npmjs.org/downloads/"
};

// ==== facet options ====
exports.company = {
  stripe: {
    "secretkey": "secrettestkey",
    "publickey": "publictestkey"
  },
  package: require('./package.json'),
  contributors: fs.readFileSync(__dirname + '/AUTHORS', 'utf8'),
  registry: "http://registry.npmjs.org/",
  registryCouch: exports.couch.registryCouch,
  HEAD: exports.HEAD
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

// registry facet
exports.search = {
  url:'http://127.0.0.1:9200/npm',
  perPage: 20
};

// all those plugins
exports.plugins = [
  {
    plugin: require('crumb'),
    options: { isSecure: true }
  },
  {
    plugin: require('./facets/company'),
    options: exports.company
  },
  {
    plugin: require('./facets/registry'),
    options: exports.search
  },
  {
    plugin: require('./facets/user'),
    options: exports.user
  },
  {
    plugin: require('./facets/ops'),
    options: require('./package.json').version
  },
  {
    plugin: require('./services/user'),
    options: exports.couch
  },
  require('./services/registry'),
  require('./services/whoshiring'),
  {
    plugin: require('./services/metrics'),
    options: exports.metrics
  },
  {
    plugin: require('./services/downloads'),
    options: exports.downloads
  }
];


function hostmatch (m) { return function (u) {
  return u.host && u.host.match(m)
} }
