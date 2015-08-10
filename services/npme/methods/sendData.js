var request = require('request'),
  log = require('bole')('npme-send-data');

module.exports = function(formGuid, data, callback) {
  var hubspot = "https://forms.hubspot.com/uploads/form/v2/:portal_id/:form_guid"
    .replace(":portal_id", process.env.HUBSPOT_PORTAL_ID)
    .replace(":form_guid", formGuid);

  request.post(hubspot, function(er, resp) {

    // we can ignore 302 responses
    if (resp.statusCode === 204 || resp.statusCode === 302) {
      return callback(null);
    }

    log.error('unexpected status code from hubspot; status=' + resp.statusCode + '; data=', data);
    callback(new Error('unexpected status code: ' + resp.statusCode));

  }).form(data);
};
