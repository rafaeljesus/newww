exports.bigco = {
  "name": "bigco",
  "description": "bigco organization",
  "resource": {
    "human_name": "BigCo Enterprises"
  },
  "created": "2015-07-10T20:29:37.816Z",
  "updated": "2015-07-10T21:07:16.799Z",
  "deleted": null
};

exports.bigcoDeleted = {
  "name": "bigco",
  "description": "bigco organization",
  "resource": {
    "human_name": "BigCo Enterprises"
  },
  "created": "2015-07-10T20:29:37.816Z",
  "updated": "2015-07-10T21:07:16.799Z",
  "deleted": true
};

exports.bigcoUsers = {
  "count": 1,
  "items": [
    {
      name: 'bob',
      email: 'bob@boom.me',
      email_verified: true,
      verification_key: '12345',
      resource: {
        fullname: "Bob Henderson",
        github: 'bob',
        twitter: 'twob',
        homepage: 'http://boom.me',
        freenode: 'bobob'
      },
      created: '2014-11-21T20:05:05.423Z',
      updated: '2015-01-24T00:08:41.269Z',
      deleted: null,
      role: "super-admin",
      sponsored: false
    }
  ]
};

exports.bigcoAddedUsers = {
  "count": 2,
  "items": [
    {
      name: 'bob',
      email: 'bob@boom.me',
      email_verified: true,
      verification_key: '12345',
      resource: {
        fullname: "Bob Henderson",
        github: 'bob',
        twitter: 'twob',
        homepage: 'http://boom.me',
        freenode: 'bobob'
      },
      created: '2014-11-21T20:05:05.423Z',
      updated: '2015-01-24T00:08:41.269Z',
      deleted: null,
      role: "team-admin",
      sponsored: "by-org"
    },
    {
      "created": "2015-08-05T15:26:46.970Z",
      "deleted": null,
      "email": "betty@somewhere.com",
      "email_verified": true,
      "has_installed_private_module_ro": false,
      "has_installed_private_module_rw": false,
      "has_published_private_module": false,
      "name": "betty",
      "resource": {},
      "role": "developer",
      "updated": "2015-08-05T15:26:46.970Z",
      "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
      "sponsored": "by-org"
    }
  ]
};

exports.bigcoAddedUsersNotPaid = {
  "count": 2,
  "items": [
    {
      name: 'bob',
      email: 'bob@boom.me',
      email_verified: true,
      verification_key: '12345',
      resource: {
        fullname: "Bob Henderson",
        github: 'bob',
        twitter: 'twob',
        homepage: 'http://boom.me',
        freenode: 'bobob'
      },
      created: '2014-11-21T20:05:05.423Z',
      updated: '2015-01-24T00:08:41.269Z',
      deleted: null,
      role: "team-admin",
      sponsored: "by-org"
    },
    {
      "created": "2015-08-05T15:26:46.970Z",
      "deleted": null,
      "email": "betty@somewhere.com",
      "email_verified": true,
      "has_installed_private_module_ro": false,
      "has_installed_private_module_rw": false,
      "has_published_private_module": false,
      "name": "betty",
      "resource": {},
      "role": "developer",
      "updated": "2015-08-05T15:26:46.970Z",
      "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
      "sponsored": false
    }
  ]
};

exports.bigcoSponsorships = [
  {
    "id": 17,
    "license_id": 1,
    "npm_user": "bob",
    "verification_key": "fb340726-bbcd-4053-9d51-c73498d9b218",
    "verified": null,
    "created": "2015-07-29T14:11:41.967Z",
    "updated": "2015-07-29T14:11:41.967Z",
    "deleted": null
  }
];

exports.bobsBigcoSubscription = [{
  "id": "sub_abcd",
  "current_period_end": 1439766874,
  "current_period_start": 1437088474,
  "quantity": 2,
  "status": "active",
  "interval": "month",
  "amount": 700,
  "license_id": 1,
  "npm_org": "bigco",
  "npm_user": "bob",
  "product_id": "1031405a-70b7-4a3f-b557-8609d9e1428a",
  "cancel_at_period_end": false
}];

exports.bobsOrgSubscriptions = [
  {
    "amount": 700,
    "cancel_at_period_end": false,
    "current_period_end": 1441391148,
    "current_period_start": 1438712748,
    "id": "sub_12346",
    "interval": "month",
    "license_id": 17,
    "npm_org": "bigco",
    "npm_user": "bob",
    "product_id": "fb340726-bbcd-4053-9d51-c73498d9b218",
    "quantity": 2,
    "status": "active"
  },
  {
    "amount": 700,
    "cancel_at_period_end": false,
    "current_period_end": 1442441358,
    "current_period_start": 1439762958,
    "id": "sub_12345",
    "interval": "month",
    "license_id": 145,
    "npm_org": "_private-modules-bob",
    "npm_user": "bob",
    "product_id": "52051d69-f3fe-46fc-919a-1ef1407ef247",
    "quantity": 1,
    "status": "active"
  }
];

exports.bobsOrgs = {
  items: [{
    name: 'bigco',
    description: '',
    role: 'super-admin'
  }],
  count: 1
};

exports.notBobsOrg = {
  "name": "bligco",
  "description": "bligco organization",
  "resource": {
    "human_name": "BligCo Enterprises"
  },
  "created": "2015-07-10T20:29:37.816Z",
  "updated": "2015-07-10T21:07:16.799Z",
  "deleted": null
};
exports.notBobsOrgUsers = {
  "count": 1,
  "items": [
    {
      name: 'bill',
      email: 'bill@boom.me',
      email_verified: true,
      verification_key: '12345',
      resource: {
        fullname: "Bill Henderson",
        github: 'bill',
        twitter: 'twill',
        homepage: 'http://bilm.me',
        freenode: 'billib'
      },
      created: '2014-11-21T20:05:05.423Z',
      updated: '2015-01-24T00:08:41.269Z',
      deleted: null,
      role: "team-admin",
      sponsoredByOrg: false
    }
  ]
};
