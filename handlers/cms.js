var CMS = require('../agents/cms');

module.exports = {
  displayCMSPage: function(request, reply) {
    CMS(request.params.slug).then(function(page) {
      reply.view('cms', {
        page: page,
        title: page.title
      });
    });
  }
}
