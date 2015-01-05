var request = require('request'),
    log = require('bole')('npme-send-data');

module.exports = function postForm (options) {
  return function (formGuid, data, callback) {
    var hubspot = options.hubspot.forms
        .replace(":portal_id", options.hubspot.portal_id)
        .replace(":form_guid", formGuid);

    request.post(hubspot, function (er, resp) {

      // we can ignore 302 responses
      if (resp.statusCode === 204 || resp.statusCode === 302) {
        return callback(null);
      }

      log.error('unexpected status code from hubspot; status=' + resp.statusCode + '; data=', data);
      callback(new Error('unexpected status code: ' + resp.statusCode));

    }).form(data);
  };
};