var CouchLogin = require('couch-login'),
    Hapi = require('hapi'),
    qs = require('querystring'),
    SECOND = 1000;

var adminCouch, anonCouch, addMetric,
    timer = {};

exports.register = function Couch (service, options, next) {

  if (options.couchAuth) {
    var ca = options.couchAuth.split(':'),
        name = ca.shift(),
        password = ca.join(':'),
        auth = { name: name, password: password };

    // the admin couch uses basic auth, or couchdb freaks out eventually
    adminCouch = new CouchLogin(options.registryCouch, 'basic');
    adminCouch.strictSSL = false;
    adminCouch.login(auth, function (er, cr, data) {
      if (er) throw er;
    });
  }

  anonCouch = new CouchLogin(options.registryCouch, NaN);

  service.dependency('newww-service-metrics', after);

  next();

  function after (service, next) {
    addMetric = service.methods.metrics.addCouchLatencyMetric;
    var userMethods = require('./methods/user')(options,service)

    service.method('couch.getPackage', getPackage, {
      cache: { expiresIn: 60 * SECOND, segment: '##package' }
    });

    service.method('couch.getUser', getUser, {
      cache: { expiresIn: 60 * SECOND, segment: '##user' }
    });

    service.method('couch.lookupUserByEmail', require('./methods/emailLookup')(adminCouch, addMetric));

    service.method('couch.getBrowseData', require('./methods/browse')(anonCouch, addMetric), {
      cache: { expiresIn: 60 * SECOND, segment: '##browse' }
    });

    service.method('couch.getRecentAuthors', require('./methods/recentAuthors')(anonCouch, addMetric))

    service.method('couch.loginUser', userMethods.login);
    service.method('couch.logoutUser', userMethods.logout);

    service.method('couch.signupUser', signupUser);

    service.method('couch.saveProfile', saveProfile);

    service.method('couch.changePass', changePass);

    service.method('couch.changeEmail', require('./methods/changeEmail')(service, adminCouch));

    service.method('couch.star', star);
    service.method('couch.unstar', unstar);

    service.method('couch.packagesCreated', packagesCreated, {
      cache: {
        staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
        staleIn: 10 * SECOND, // refresh after 10 seconds
        segment: '##totalPackages'
      }
    });

    next();
  }
};

exports.register.attributes = {
  pkg: require('./package.json')
};

//========== functions ===========

function getPackage (package, next) {
  timer.start = Date.now();
  anonCouch.get('/registry/' + package, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'package ' + package);

    if (er || data.error) {
      return next(Hapi.error.notFound('Package not found: ' + package));
    }

    return next(null, data);
  });
}

function getUser (name, next) {
  timer.start = Date.now();
  anonCouch.get('/_users/org.couchdb.user:' + name, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'user ' + name);

    if (er || cr && cr.statusCode !== 200 || !data || data.error) {
      return next(Hapi.error.notFound('Username not found: ' + name));
    }

    return next(null, data);
  })
}

function signupUser (acct, next) {
  timer.start = Date.now();
  anonCouch.signup(acct, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'signupUser');

    if (er || cr && cr.statusCode >= 400 || data && data.error) {
        var error = "Failed creating account.  CouchDB said: "
                  + ((er && er.message) || (data && data.error))

      return next(Hapi.error.forbidden(error));
    }

    return next(null, data);
  });
}

function saveProfile (user, next) {
  timer.start = Date.now();
  adminCouch.post('/_users/_design/_auth/_update/profile/' + user._id, user, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'saveProfile');

    if (er || cr && cr.statusCode !== 201 || !data || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    return next(null, data);
  });
}

function changePass (auth, next) {
  timer.start = Date.now();
  adminCouch.changePass(auth, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'changePass');

    if (er || cr.statusCode >= 400 || data && data.message) {
      var error = er && er.message || data && data.message;
      return next(Hapi.error.forbidden(error));
    }

    return next(null, data);
  });
}

function star (package, username, next) {
  timer.start = Date.now();
  adminCouch.put('/registry/_design/app/_update/star/' + package, username, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'star');

    if (er || cr && cr.statusCode !== 201 || !data || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    return next(null, data);
  });
}

function unstar (package, username, next) {
  timer.start = Date.now();
  adminCouch.put('/registry/_design/app/_update/unstar/' + package, username, function (er, cr, data) {
    timer.end = Date.now();
    addMetric(timer, 'unstar');

    if (er || cr && cr.statusCode !== 201 || !data || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    return next(null, data);
  });
}

function packagesCreated (next) {
  timer.start = Date.now();
  anonCouch.get('/registry/_design/app/_view/fieldsInUse?group_level=1&startkey="name"&endkey="name"&stale=update_after', function (er, cr, data) {

    timer.end = Date.now();
    addMetric(timer, 'packagesCreated');

    if (er || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    if (data.rows && data.rows.length > 0 && data.rows[0].value) {
      return next(null, data.rows[0].value);
    }

    return next(null, 0); // worst case scenario
  });
}