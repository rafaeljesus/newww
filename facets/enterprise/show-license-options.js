var nodemailer = require('nodemailer');

var config = require('../../config');

module.exports = function buyLicense (request, reply) {

  /*
  var verifyTrial = request.server.methods.npme.verifyTrial,
      getCustomer = request.server.methods.npme.getCustomer,
      getLicenses = request.server.methods.npme.getLicenses;
  */

  // get email & license key from parameters

  // get license details from /license/[productkey]/[email]/[licensekey]

    // fail if license invalid

  // get customer details from /customer/[email]

    // fail if customer invalid

  // show option to buy licenses
  var opts = {}
  return reply.view('enterprise/show-license-options', opts);
};