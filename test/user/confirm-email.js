var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var redis = require('redis'),
    spawn = require('child_process').spawn,
    config = require('../../config').server.cache;

    config.port = 6379;
    config.password = '';

var server,
    client, oldCache, redisProcess;

// prepare the server
// before(function (done) {
//   require('../mocks/server')(function (obj) {
//     server = obj;
//     done();
//   });
// });

before(function (done) {
  var redisConfig = '--port ' + config.port;
  redisProcess = spawn('redis-server', [redisConfig]);
  client = redis.createClient(config.port, config.host);
  client.auth(config.password, function () {});
  client.on("error", function (err) {
    console.log("Error " + err);
  });

  require('../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = client;
    done();
  });


  // oldCache = server.app.cache;
  // server.app.cache.get = function (key, cb) {
  //   client.get(key, function (er, val) {
  //     if (val) {
  //       var obj = {item: JSON.parse(val)};
  //       return cb(er, obj.item, obj);
  //     }

  //     return cb(er, null);
  //   });
  // };

  // server.app.cache.set = function (key, val, ttl, cb) {
  //   return client.set(key, JSON.stringify(val), cb);
  // };

  // server.app.cache.drop = function (key, cb) {
  //   return client.del(key, cb);
  // };

  // done();
});

after(function(done) {
  client.flushdb();
  server.stop(function () {
    server.app.cache = oldCache;
    // delete server.app.cache._cache.connection.client;
    redisProcess.kill('SIGKILL');
    done();
  });
});

// TODO add a redis instance so that we can test all of these wonderful little things

describe('Confirming an email address', function () {

  it('returns an error if no token is passed', function (done) {
    var opts = {
      url: '/confirm-email'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('returns an error if the token does not exist in the db', function (done) {
    var opts = {
      url: '/confirm-email/dodobird'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('returns an error if the token in the cache does not match the token from the url', function (done) {

    var boom = {
      name: 'boom',
      email: 'boom@bang.com',
      token: '54321'
    };

    var opts = {url: '/confirm-email/12345'};

    client.set('email_confirm_8cb2237d0679ca88db6464eac60da96345513964', boom, 20, function () {

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        done();
      });
    });
  });

  it('drops the token after confirming the email', function (done) {
    var boom = {
      name: 'boom',
      email: 'boom@bang.com',
      token: '12345'
    };

    var opts = {url: '/confirm-email/12345'};

    client.set('email_confirm_8cb2237d0679ca88db6464eac60da96345513964', boom, 20, function () {

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/email-confirmed');
        client.keys('*', function (err, keys) {
          expect(keys.indexOf('email_confirm_8cb2237d0679ca88db6464eac60da96345513964')).to.equal(-1);
          done();
        });
      });
    });
  });

  it('goes to the email confirmation template on success', function (done) {
    var boom = {
      name: 'boom',
      email: 'boom@bang.com',
      token: '12345'
    };

    var opts = {url: '/confirm-email/12345'};

    client.set('email_confirm_8cb2237d0679ca88db6464eac60da96345513964', boom, 20, function () {

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/email-confirmed');
        done();
      });
    });
  });
});
