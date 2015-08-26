module.exports = [
  {
    // shortcut for viewing your own stars
    path: "/star",
    method: "GET",
    handler: require('../handlers/star'),
  }, {
    paths: [
      "/~",
      "/profile",
    ],
    method: "GET",
    handler: require('../facets/user/show-profile')
  }, {
    path: "/profile-edit",
    method: "GET",
    handler: require('../handlers/user').showProfileEdit
  }, {
    path: "/profile-edit",
    method: "PUT",
    handler: require('../handlers/user').handleProfileEdit
  }, {
    path: "/profile-edit",
    method: "POST",
    handler: require('../handlers/user').handleProfileEdit
  }, {
    path: "/resend-email-confirmation",
    method: "GET",
    handler: require('../facets/user/show-resend-email-confirmation')
  }, {
    path: "/email-edit",
    method: "GET",
    handler: require('../facets/user/show-email-edit')
  }, {
    path: "/email-edit",
    method: "PUT",
    handler: require('../facets/user/show-email-edit')
  }, {
    path: "/email-edit",
    method: "POST",
    handler: require('../facets/user/show-email-edit')
  }, {
    // confirm or revert
    // /email-edit/confirm/1234567
    // /email-edit/revert/1234567
    path: "/email-edit/{token*2}",
    method: "GET",
    handler: require('../facets/user/show-email-edit')
  }, {
    path: "/password",
    method: "GET",
    handler: require('../facets/user/show-password')
  }, {
    path: "/password",
    method: "POST",
    handler: require('../facets/user/show-password')
  }, {
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
  }, {
    path: "/settings/billing/subscribe",
    method: "POST",
    handler: require('../handlers/customer').subscribe
  }, {
    paths: [
      "/package/{package}/collaborators",
      "/package/{scope}/{project}/collaborators",
    ],
    method: "PUT",
    handler: require('../handlers/collaborator').add
  }, {
    paths: [
      "/package/{package}/collaborators/{username}",
      "/package/{scope}/{project}/collaborators/{username}",
    ],
    method: "POST",
    handler: require('../handlers/collaborator').update
  }, {
    paths: [
      "/package/{package}/collaborators/{username}",
      "/package/{scope}/{project}/collaborators/{username}",
    ],
    method: "DELETE",
    handler: require('../handlers/collaborator').del
  }, {
    path: "/package/{scope}/{project}",
    method: "POST",
    handler: require('../handlers/package').update
  }, {
    path: "/org/{org}",
    method: "GET",
    handler: require('../handlers/org').getOrg
  }, {
    path: "/org/{org}",
    method: "POST",
    handler: require('../handlers/org').updateOrg
  }, {
    path: "/org/create",
    method: "GET",
    handler: function(request, reply) {
      return reply.view('org/create');
    }
  }
];
