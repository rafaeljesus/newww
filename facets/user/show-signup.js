var Joi = require('joi'),
    userValidate = require('npm-user-validate'),
    murmurhash = require('murmurhash');

module.exports = function signup (request, reply) {
  var signupUser = request.server.methods.signupUser;

  var opts = {
    user: request.auth.credentials,
    errors: []
  };

  if (request.method === 'post') {
    var schema = Joi.object().keys({
      name: Joi.string().required(),
      password: Joi.string().required(),
      verify: Joi.string().required(),
      email: Joi.string().email().required()
    });

    var joiOptions = {
      convert: false,
      abortEarly: false
    };

    var data = request.payload;

    Joi.validate(data, schema, joiOptions, function (err, value) {

      if (err) {
        opts.errors.push(err.details);
      }

      if (data.password !== data.verify) {
        opts.errors.push(new Error("Passwords don't match"));
      }

      userValidate.username(data.name) && opts.errors.push(userValidate.username(data.name));

      if (opts.errors.length) {
        return reply.view('signup-form', opts);
      }

      request.auth.session.clear();

      signupUser(value, function (er, user) {

        if (er) {
          opts.errors.push(er);
          return reply.view('signup-form', opts);
        }

        var sid = murmurhash.v3(user.name, 55).toString(16);

        user.sid = sid;

        request.server.app.cache.set(sid, user, 0, function (err) {
          if (err) {
            console.log(err)
            reply(err);
          }

          request.auth.session.set({sid: sid});

          return reply().redirect('/profile-edit');
        });

      });
    });

  }


  if (request.method === 'get' || request.method === 'head') {
    // opts.hiring

    return reply.view('signup-form', opts);
  }

};