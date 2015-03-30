var gravatar = require('gravatar').url,
    humans = require('npm-humans'),
    _ = require('lodash');

module.exports = function (request, reply) {

  humans = _.each(humans, function (m) {
    return m.avatar = gravatar(m.email, {s:100, d:'retro'}, true);
  });

  var opts = {
    humans: humans
  };

  return reply.view('company/contact', opts);

};