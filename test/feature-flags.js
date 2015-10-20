var expect = require('code').expect,
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  it = lab.test,
  feature = require('../lib/feature-flags');

var requests = {
  sindresorhus: {
    auth: {
      credentials: {
        name: 'sindresorhus'
      }
    }
  },
  maxogden: {
    auth: {
      credentials: {
        name: 'maxogden'
      }
    }
  },
  smikes: {
    auth: {
      credentials: {
        name: 'smikes'
      }
    }
  },
  cat: {
    auth: {
      credentials: {
        name: 'cat'
      }
    }
  },
  match: {
    auth: {
      credentials: {
        name: 'match-12345'
      }
    }
  },
  nomatch: {
    auth: {
      credentials: {
        name: 'match-things'
      }
    }
  },
  rockbot: {
    auth: {
      credentials: {
        name: 'rockbot'
      }
    }
  },
  rockbotnomatch: {
    auth: {
      credentials: {
        name: 'rockbot-12345'
      }
    }
  },
  anonymous: {}
};

describe('feature flags', function() {
  // Delete all process.env.FEATURE_* vars before each test
  afterEach(function(done) {
    Object.keys(process.env).forEach(function(key) {
      if (key.match(/^FEATURE_/i)) {
        delete process.env[key];
      }
    });
    done();
  });

  describe('enabled', function() {
    it("returns true if variable is 'true'", function(done) {
      process.env.FEATURE_SNACK_TIME = 'true';
      expect(feature('SNACK_TIME')).to.be.true();
      done();
    });

    it("returns true if variable is 'TRUE'", function(done) {
      process.env.FEATURE_SNACK_TIME = 'TRUE';
      expect(feature('SNACK_TIME')).to.be.true();
      done();
    });

    it('allows lowercase values', function(done) {
      process.env.FEATURE_SNAKE_TIME = 'true';
      expect(feature('snake_time')).to.be.true();
      done();
    });

    it('allows feature name to include `feature_` prefix', function(done) {
      process.env.FEATURE_SNAKE_TIME = 'true';
      expect(feature('feature_snake_time')).to.be.true();
      done();
    });
  });

  describe('disabled', function() {
    it('returns false if variable does not exist', function(done) {
      expect(feature('nonexistent')).to.be.false();
      done();
    });

    it('returns false if variable is an empty string', function(done) {
      process.env.FEATURE_NONEXISTENT = '';
      expect(feature('nonexistent')).to.be.false();
      done();
    });

    it("returns false if variable is 'false'", function(done) {
      process.env.FEATURE_NONEXISTENT = 'false';
      expect(feature('nonexistent')).to.be.false();
      done();
    });

    it("returns false if variable is 'FALSE'", function(done) {
      process.env.FEATURE_NONEXISTENT = 'FALSE';
      expect(feature('nonexistent')).to.be.false();
      done();
    });
  });

  describe('whitelisted users', function() {

    beforeEach(function(done) {
      process.env.FEATURE_RAINBOWS = 'maxogden, sindresorhus,somebody-else';
      done();
    });

    it('returns true for whitelisted users', function(done) {
      expect(feature('rainbows', requests.sindresorhus)).to.be.true();
      expect(feature('rainbows', requests.maxogden)).to.be.true();
      done();
    });

    it('returns false for users not in whitelist', function(done) {
      expect(feature('rainbows', requests.cat)).to.be.false();
      done();
    });

    it('returns false for anonymous users', function(done) {
      expect(feature('rainbows', requests.anonymous)).to.be.false();
      done();
    });

    it('returns false if request object is absent', function(done) {
      expect(feature('rainbows')).to.be.false();
      done();
    });
  });

  describe('whitelisted groups', function() {

    beforeEach(function(done) {
      process.env.FEATURE_UNICORN_PAGE = 'group:npm-humans, group:friends,cat,somebody-else, regex:match-\\d+';
      done();
    });

    it('returns true for npm humans', function(done) {
      expect(feature('unicorn_page', requests.rockbot)).to.be.true();
      done();
    });

    it('returns true for friends', function(done) {
      expect(feature('unicorn_page', requests.smikes)).to.be.true();
      done();
    });

    it('returns true for one-off users', function(done) {
      expect(feature('unicorn_page', requests.cat)).to.be.true();
      done();
    });

    it('returns true for regex matches', function(done) {
      expect(feature('unicorn_page', requests.match)).to.be.true();
      done();
    });

    it('returns false for regex mis-matches', function(done) {
      expect(feature('unicorn_page', requests.nomatch)).to.be.false();
      done();
    });

    it('returns false for usernames that are potentially regex matches for list entries', function(done) {
      expect(feature('unicorn_page', requests.rockbotnomatch)).to.be.false();
      done();
    });

    it('returns false for users not in whitelist', function(done) {
      expect(feature('unicorn_page', requests.sindresorhus)).to.be.false();
      done();
    });

    it('returns false if request object is absent', function(done) {
      expect(feature('unicorn_page')).to.be.false();
      done();
    });
  });

  describe('getFeatures', function() {
    it('finds all the environmental and user-resourced feature flags', function(done) {
      process.env.FEATURE_BOOM = 'true';
      process.env.FEATURE_TADA = 'group:npm-humans';
      process.env.SANDWICH = 'something-important-probably';

      var request = {
        loggedInUser: {
          resource: {
            feature_lala: 't',
            feature_nope: 'blah',
            twitter: '@user'
          }
        }
      };

      var features = feature.getFeatures(request);

      expect(features).to.deep.equal({
        boom: true,
        tada: false,
        lala: true,
        nope: false
      });

      delete process.env.FEATURE_BOOM;
      delete process.env.FEATURE_TADA;
      delete process.env.SANDWICH;
      done();
    });
  });

  describe('filterFeatures', function() {
    it('takes an object and filters out the feature flags', function(done) {
      var obj = {
        feature_something: 'stuff',
        feature_grand_master: 't',
        nothing_special: 'ta',
        nope_feature_thing: 'false'
      };

      var filtered = feature.filterFeatures(obj);
      expect(filtered).to.deep.equal({
        feature_something: 'stuff',
        feature_grand_master: 't'
      });
      done();
    });
  });
});
