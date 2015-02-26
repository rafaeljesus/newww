var nodemailer = require('nodemailer');

var config = require('../../config');

module.exports = function buyLicense (request, reply) {
  var verifyTrial = request.server.methods.npme.verifyTrial,
      getCustomer = request.server.methods.npme.getCustomer,
      getLicenses = request.server.methods.npme.getLicenses;

  return reply.view('enterprise/complete', opts);
};