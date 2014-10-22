var nock = require('nock');

module.exports = function (config) {
  var hubspot = nock('https://forms.hubspot.com')
      // .filteringPath(/startkey=[^&]*/g, 'startkey=XXX')
      .log(console.log)

      .post('/uploads/form/v2/123456/12345')
      .reply(204)

        .post('/uploads/form/v2/123456/12345')
        .reply(302)

      .post('/uploads/form/v2/123456/boom')
      .reply(400)


  return hubspot;
}