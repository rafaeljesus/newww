var gravatar = require('gravatar').url;

module.exports = function (request, reply) {

  var maintainers = [
    {
      username: 'isaacs',
      email: 'i@izs.me'
    },
    {
      username: 'seldo',
      email: 'laurie@npmjs.com'
    },
    {
      username: 'rod',
      email: 'rod.boothby@gmail.com'
    },
    {
      username: 'rockbot',
      email: 'raquel@rckbt.me'
    },
    {
      username: 'ceejbot',
      email: 'ceejceej@gmail.com'
    },
    {
      username: 'bcoe',
      email: 'bencoe@gmail.com'
    },
    {
      username: 'othiym23',
      email: 'ogd@aoaioxxysz.net'
    },
    {
      username: 'zeke',
      email: 'zeke@sikelianos.com'
    },
    {
      username: 'iarna',
      email: 'me@re-becca.org'
    }
  ];

  maintainers.forEach(function (m) {
    m.avatar = gravatar(m.email, {s:100, d:'retro'}, true);
  });

  var opts = {
    user: request.auth.credentials,
    maintainers: maintainers
  };

  return reply.view('company/contact', opts);

}