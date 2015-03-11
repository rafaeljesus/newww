var request = require('request'),
    log = require('bole')('npme-verify-trial');

module.exports = function(verificationKey, callback) {

  var trialEndpoint = config.license.api + '/trial';

  // check if a trial with this verification key exists already
  request.get({
    url: trialEndpoint + '/' + verificationKey,
    json: true
  }, function (er, resp, trial) {

    if (resp.statusCode === 404) {
      log.error('unable to find verification key ' + verificationKey);

      // can't find a trial for that key
      return callback(new Error('verification key not found'));
    }

    if (resp.statusCode !== 200) {
      log.error('unexpected status code from hubspot; status=' + resp.statusCode + '; verificationKey=' + verificationKey);
      return callback(new Error('problem verifying trial for ' + verificationKey));
    }

    // they already have a trial, but has it been verified?
    if (trial.verified) {
      return callback(null, trial);
    }

    request.put({
      url: trialEndpoint + '/' + trial.id + '/verification',
      json: true
    }, function (er, resp, verifiedTrial) {

      if (resp.statusCode === 200) {
        return callback(null, verifiedTrial);
      }

      log.error('unexpected status code from hubspot; status=' + resp.statusCode+ '; trial=', trial);
      return callback(new Error('problem starting trial for ' + trial.id));
    });
  });
}