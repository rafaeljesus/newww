var nock = require('nock');

module.exports = function (config) {
  // console.log(config.registryCouch)

  var couch = nock(config.registryCouch)
    .filteringPath(/startkey=[^&]*/g, 'startkey=XXX')
    // .log(console.log)

    // --- get package ---
    .get('/registry/request')
    .reply(200, require('../fixtures/packages/request.json'))

    .get('/registry/goober')
    .reply(404, {"error":"not_found","reason":"missing"})

    // --- get user ---
    .get('/_users/org.couchdb.user:blah')
    .reply(200, require('../fixtures/users').blah)

    .get('/_users/org.couchdb.user:boom').times(5)
    .reply(200, require('../fixtures/users').boom)

    .get('/_users/org.couchdb.user:boop')
    .reply(404, {"error":"not_found","reason":"missing"})

    // --- lookup user email ---
    .get('/_users/_design/_auth/_view/userByEmail?startkey=XXX&endkey=%5B%22boom%40boom.com%22%2C%7B%7D%5D&group=true')
    .reply({"rows":[
      { "key": ["boom@boom.com","boom"], "value": 1 }
    ]})

    // --- modify user ---
    .put('/_users/org.couchdb.user:boom').thrice()
    .reply(201, require('../fixtures/users').boom)

    .put('/_users/org.couchdb.user:boom?rev=1-7adf7e546de1852cec39894c0d652fb4')
    .reply(201, require('../fixtures/users').boom)

    // --- modify profile ---
    .post('/_users/_design/_auth/_update/profile/blah')
    .reply(201, { ok: 'updated profile' })

    // --- modify email ---
    .post('/_users/_design/_auth/_update/email/org.couchdb.user:boom')
    .reply(201, { ok: 'updated email address' })

    // --- log in ---
    .post('/_session').times(4)
    .reply(200, require('../fixtures/users').boom)

    // --- log out ---
    .delete('/_session')
    .reply(200)

    // --- stars ---
    .put('/registry/_design/app/_update/star/request', 'boom')
    .reply(201, { ok: 'starred'})

    .put('/registry/_design/app/_update/unstar/request', 'boom')
    .reply(201, { ok: 'unstarred'})

    // --- total packages ---
    .get('/registry/_design/app/_view/fieldsInUse?group_level=1&startkey=XXX&endkey=%22name%22&stale=update_after')
    .reply(200, { rows: [ { key: 'name', value: 3681 } ] })

    // --- browse ---
    .get('/registry/_design/app/_view/browseStarPackage?group_level=2&stale=update_after')
    .reply(200, require('../fixtures/browse/starred'))

    // --- recent authors ---
    .get('/registry/_design/app/_view/browseAuthorsRecent?group_level=2&startkey=XXX&stale=update_after').twice()
    .reply(200, require('../fixtures/browse/author'))

  return couch;
}
