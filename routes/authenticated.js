var config = require('../config');

module.exports = [
  {
    // shortcut for viewing your own stars
    path: "/star",
    method: "GET",
    handler: require('../handlers/star'),
  },{
    paths: [
      "/~",
      "/profile",
    ],
    method: "GET",
    handler: require('../facets/user/show-profile')
  },{
    path: "/profile-edit",
    method: "GET",
    handler: require('../facets/user/show-profile-edit')
  },{
    path: "/profile-edit",
    method: "PUT",
    handler: require('../facets/user/show-profile-edit')
  },{
    path: "/profile-edit",
    method: "POST",
    handler: require('../facets/user/show-profile-edit')
  },{
    path: "/email-edit",
    method: "GET",
    handler: require('../facets/user/show-email-edit')(config.user.mail)
  },{
    path: "/email-edit",
    method: "PUT",
    handler: require('../facets/user/show-email-edit')(config.user.mail)
  },{
    path: "/email-edit",
    method: "POST",
    handler: require('../facets/user/show-email-edit')(config.user.mail)
  },{
    // confirm or revert
    // /email-edit/confirm/1234567
    // /email-edit/revert/1234567
    path: "/email-edit/{token*2}",
    method: "GET",
    handler: require('../facets/user/show-email-edit')(config.user.mail)
  },{
    path: "/password",
    method: "GET",
    handler: require('../facets/user/show-password')
  },{
    path: "/password",
    method: "POST",
    handler: require('../facets/user/show-password')
  },{
    path: "/settings/billing",
    method: "GET",
    handler: require('../handlers/customer').getBillingInfo
  }, {
    path: "/settings/billing",
    method: "POST",
    handler: require('../handlers/customer').updateBillingInfo
  }, {
    path: "/settings/billing/cancel",
    method: "POST",
    handler: require('../handlers/customer').deleteBillingInfo
  }
]
