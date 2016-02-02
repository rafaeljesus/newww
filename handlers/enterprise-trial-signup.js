var utils = require('../lib/utils');
var VError = require('verror');
var sendEmail = require('../adapters/send-email');

// if they agree to the ULA, notify hubspot, create a trial and send verification link

module.exports = function trialSignup(request, reply) {
  var postToHubspot = request.server.methods.npme.sendData,
    getCustomer = request.server.methods.npme.getCustomer;

  var opts = {};

  var data = {
    hs_context: {
      pageName: "enterprise-trial-signup",
      ipAddress: utils.getUserIP(request)
    },
    // we can trust the email is fine because we've verified it in the show-ula handler
    email: request.payload.customer_email,
  };

  postToHubspot(process.env.HUBSPOT_FORM_NPME_AGREED_ULA, data, function(err) {

    if (err) {
      return reply(new VError(err, "Could not hit ULA notification form on Hubspot"));;
    }

    getCustomer(data.email, function(err, customer) {

      if (err) {
        return reply(new VError(err, "Unknown problem with customer record"));
      } else if (!customer) {
        return reply(new VError("Unable to locate customer '%s'", data.email));
      } else if (customer && String(customer.id) == String(request.payload.customer_id)) {
        return createTrialAccount(request, reply, customer);
      } else {
        return reply(new VError("Unable to verify customer record '%s'", data.email));
      }
    });
  });
};

function createTrialAccount(request, reply, customer) {

  var createTrial = request.server.methods.npme.createTrial;

  var opts = {};
  createTrial(customer, function(err, trial) {
    if (err) {
      return reply(new VError(err, "There was an error with creating a trial for %j", customer.id));
    }

    return sendVerificationEmail(request, reply, customer, trial);
  });
}

function sendVerificationEmail(request, reply, customer, trial) {

  var opts = {};

  var user = {
    name: customer.name,
    email: customer.email,
    verification_key: trial.verification_key
  };

  sendEmail('npme-trial-verification', user, request.redis)
    .then(function() {
      return reply.view('enterprise/thanks', opts);
    })
    .catch(function(err) {
      return reply(new VError(err, "unable to send verification email to %j", customer));
    });
}
