var config = module.exports = {};

config.license = {
  "hubspot": {
    "forms": "https://forms.hubspot.com/uploads/form/v2/:portal_id/:form_guid",
    "portal_id": "123456",
    "form_npme_signup": "12345",
    "form_npme_agreed_ula": "12345",
    "form_npme_contact_me": "12345",
    "form_private_npm": "12345",
    "form_private_npm_signup": "12345"
  },
  "api": "https://billing.website.com",
};

config.npme = {
  product_id: '12345',
  trial_length: 5,
  trial_seats: 2
};
