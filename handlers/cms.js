var CMS = require('../agents/cms');

module.exports = {
  displayCMSPage: function(request, reply) {
    CMS(request.params.slug).then(function(page) {
      reply.view('cms', {
        page: page,
        title: page.title
      });
    }, function(err) {
      request.logger.error(err);
      if (err.statusCode == 404) {
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply.view('errors/internal', err).code(500);
      }
    }).catch(function(err) {
      request.logger.error(err);
    });
  }
}
