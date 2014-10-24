var request = require('request'),
    log = require('bole')('npme-verify-trial'),
    uuid = require('node-uuid');

module.exports = function verifyTrial (options) {

  return function (verificationKey, next) {

    var trialEndpoint = options.api + '/trial';

    // check if a trial with this verification key exists already
    request.get({
      url: trialEndpoint + '/' + verificationKey,
      json: true
    }, function (er, resp, trial) {

      if (resp.statusCode === 404) {
        // can't find a trial for that key
        return next(new Error('verification key not found'));
      }

      if (resp.statusCode !== 200) {
        return next(new Error('problem verifying trial'));
      }

      // they already have a trial, but has it been verified?
      if (trial.verified) {
        return next(null, trial);
      }

      request.put({
        url: trialEndpoint + '/' + trial.id + '/verification',
        json: true
      }, function (er, resp, verifiedTrial) {

        if (resp.statusCode !== 200) {
          return next(new Error('problem starting trial'));
        }

        return next(null, verifiedTrial);
      });
    });
  }
}