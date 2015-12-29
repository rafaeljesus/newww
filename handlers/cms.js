var CMS = require('../agents/cms');

module.exports = {
  displayCMSPage: function(request, reply) {
    CMS.getPage(request.params.slug).then(function(page) {
      reply.view('cms', {
        contentIsFullwidth: true,
        page: page,
        title: page.title
      });
    }).catch(function(err) {
      if (err.statusCode == 404) {
        request.logger.error(err);
        return reply.view('errors/not-found', err).code(404);
      } else {
        return reply(err);
      }
    });
  }
}
