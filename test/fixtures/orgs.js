exports.bigco = {
  "name":"bigco",
  "description":"bigco organization",
  "resource":{
    "fullname":"BigCo Enterprises"
  },
  "created":"2015-07-10T20:29:37.816Z",
  "updated":"2015-07-10T21:07:16.799Z",
  "deleted":null
};

exports.bigcoDeleted = {
  "name":"bigco",
  "description":"bigco organization",
  "resource":{
    "fullname":"BigCo Enterprises"
  },
  "created":"2015-07-10T20:29:37.816Z",
  "updated":"2015-07-10T21:07:16.799Z",
  "deleted":true
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
      role: "team-admin"
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
]