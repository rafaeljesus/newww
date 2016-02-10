var request = require('request');
var P = require('bluebird');

module.exports = function sendDataToHubspot(formGuid, data, callback) {
  var hubspot = "https://forms.hubspot.com/uploads/form/v2/:portal_id/:form_guid"
    .replace(":portal_id", process.env.HUBSPOT_PORTAL_ID)
    .replace(":form_guid", formGuid);

  return new P(function(accept, reject) {
    request.post(hubspot, function(er, resp) {

      // we can ignore 302 responses
      if (resp.statusCode === 204 || resp.statusCode === 302) {
        return accept(null);
      }

      return reject(new Error('unexpected status code: ' + resp.statusCode));

    }).form(data);
  }).nodeify(callback);
};
