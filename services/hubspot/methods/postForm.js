var request = require('request'),
    log = require('bole')('hubspot-post-form'),
    uuid = require('node-uuid');

module.exports = function postForm (options) {
  return function (formGuid, data, next) {
    var hubspot = options.hubspot.forms
        .replace(":portal_id", options.hubspot.portal_id)
        .replace(":form_guid", formGuid);

    request.post(hubspot, function (er, resp, body) {
      // we can ignore 302 responses
      if (resp.statusCode === 204 || resp.statusCode === 302) {
        return next(null);
      } else {
        var err = new Error("unexpected status code: ", resp.statusCode);

        log.warn(uuid.v1(), err);
        return next(err);
      }
    }).form(data);
  }
}