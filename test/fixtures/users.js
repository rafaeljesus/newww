exports.fakeuser = {
  name: 'bob',
  email: 'bob@boom.me',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'bob',
    twitter: '',
    homepage: 'http://boom.me',
    appdotnet: 'bobob'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.mikeal = {
  name: 'mikeal',
  email: 'mikeal@president-of-javascript.com',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'mikeal',
    twitter: 'mikeal',
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.diana_delinquent = {
  name: 'diana_delinquent',
  email: 'diana@late.fee',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'diana_delinquent',
    twitter: 'diana',
    homepage: 'http://diana.com'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.norbert_newbie = {
  name: 'norbert_newbie',
  email: 'norbert@newbies.com',
  email_verified: null,
  verification_key: '12345',
  resource: {
    github: 'norbs',
    twitter: 'norbington',
    homepage: 'http://norbert.name'
  },
  created: '2014-11-21T20:05:05.423Z',
  updated: '2015-01-24T00:08:41.269Z',
  deleted: null
};

exports.fakeusercouch = {
  "_id": "org.couchdb.user:fakeusercouch",
  "_rev": "4-ee6a224abd5503882ac5150f9e8f5a7a",
  "name": "fakeusercouch",
  "type": "user",
  "salt": "b6da1cbb4e1e0a3a4903afc92ed73c11293848485d057f34c8ab3c6093ba",
  "date": "2014-04-16T18:16:44.025Z",
  "email": "b@fakeuser.com",
  "avatar": {
    "small": "https://secure.gravatar.com/avatar/81668436195664f28a376e0407dbfbd3?s=50&d=retro",
    "medium": "https://secure.gravatar.com/avatar/81668436195664f28a376e0407dbfbd3?s=100&d=retro",
    "large": "https://secure.gravatar.com/avatar/81668436195664f28a376e0407dbfbd3?s=496&d=retro"
   },
  "fields": [{
    "name": "fullname",
    "value": "Boom",
    "title": "Full Name",
    "show": "Boom"
  }, {
    "name": "email",
    "value": "b@fakeuser.com",
    "title": "Email",
    "show": "<a href=\"mailto:b@fakeuser.com\">b@fakeuser.com</a>"
  }, {
    "name": "github",
    "value": "abcde",
    "title": "GitHub",
    "show": "<a rel=\"me\" href=\"https://github.com/abcde\">abcde</a>"
  }, {
    "name": "twitter",
    "value": "fakeuser",
    "title": "Twitter",
    "show": ""
  }, {
    "name": "appdotnet",
    "value": "",
    "title": "App.net",
    "show": ""
  }, {
    "name": "homepage",
    "value": "",
    "title": "Homepage",
    "show": ""
  }, {
    "name": "freenode",
    "value": "",
    "title": "IRC Handle",
    "show": ""
  }],
  "fullname": "Boom",
  "github": "abcde",
  "twitter": "",
  "appdotnet": "",
  "homepage": "",
  "freenode": "",
  "roles": [],
  "mustChangePass": false,
  "derived_key": "a7a5bcffa127d44e214fbb0c3148b89c23100c9a",
  "password_scheme": "pbkdf2",
  "iterations": 10
};

exports.fakeuserNewProfile = {
  fullname: 'Fake User',
  github: 'fakeuser',
  twitter: 'fakeuser',
  homepage: '',
  freenode: ''
};

exports.fakeuserChangePassword = {
  current: '12345',
  new: 'abcde',
  verify: 'abcde'
};

exports.fakeusercli = {
  "_id": "org.couchdb.user:fakeusercli",
  "_rev": "1-dadbd134b001443c5fe120e4444b2b0e",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "name": "fakeusercli",
  "email": "f@fakeuser.me",
  "type": "user",
  "roles": [],
  "date": "2014-04-26T00:54:43.315Z",
  "derived_key": "1b3bf7b17b4d1363f07e2701bf6ed7e220ebaaf3",
  "salt": "67bbd97d32e397ded845e279fb371ea7",
  "mustChangePass": true
};

exports.npmEmployee = {
  "_id": "org.couchdb.user:seldo",
  "_rev": "1-dadbd134b001443c5fe120e4444b2b0e",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "name": "seldo",
  "email": "rainbow-unicorns@seldo.com",
  "type": "user",
  "roles": [],
  "date": "2014-04-26T00:54:43.315Z",
  "derived_key": "1b3bf7b17b4d1363f07e2701bf6ed7e220ebaaf3",
  "salt": "67bbd97d32e397ded845e279fb371ea7"
};

exports.fakeuserCliFields = [{
  name: 'fullname',
  value: '',
  title: 'Full Name',
  show: ''
}, {
  name: 'email',
  value: 'f@fakeuser.me',
  title: 'Email',
  show: '<a href="mailto:f@fakeuser.me">f@fakeuser.me</a>'
}, {
  name: 'github',
  value: '',
  title: 'GitHub',
  show: ''
}, {
  name: 'twitter',
  value: '',
  title: 'Twitter',
  show: ''
}, {
  name: 'appdotnet',
  value: '',
  title: 'App.net',
  show: ''
}, {
  name: 'homepage',
  value: '',
  title: 'Homepage',
  show: ''
}, {
  name: 'freenode',
  value: '',
  title: 'IRC Handle',
  show: ''
}];

exports.fakeusernoemail = {
  "_id": "org.couchdb.user:fakeusernoemail",
  "_rev": "1-dadbd134b001443c5fe120e4444b2b0e",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "name": "fakeusernoemail",
  "email": "",
  "type": "user",
  "roles": [],
  "date": "2014-04-26T00:54:43.315Z",
  "derived_key": "1b3bf7b17b4d1363f07e2701bf6ed7e220ebaaf3",
  "salt": "67bbd97d32e397ded845e279fb371ea7"
};

exports.fakeuserbademail = {
  "_id": "org.couchdb.user:fakeuserbademail",
  "_rev": "1-dadbd134b001443c5fe120e4444b2b0e",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "name": "fakeuserbademail",
  "email": "fake@bademail",
  "type": "user",
  "roles": [],
  "date": "2014-04-26T00:54:43.315Z",
  "derived_key": "1b3bf7b17b4d1363f07e2701bf6ed7e220ebaaf3",
  "salt": "67bbd97d32e397ded845e279fb371ea7"
};


exports.full_meta = {
  "name": "full_meta",
  "fields": [{
    "name": "fullname",
    "value": "Phull",
    "title": "Full Meta",
    "show": "Boom"
  }, {
    "name": "email",
    "value": "full@meta.com",
    "title": "Email",
    "show": "<a href=\"mailto:b@fakeuser.com\">b@fakeuser.com</a>"
  }, {
    "name": "github",
    "value": "full_meta_github",
    "title": "GitHub",
    "show": "<a rel=\"me\" href=\"https://github.com/abcde\">abcde</a>"
  }, {
    "name": "twitter",
    "value": "full_meta_twitter",
    "title": "Twitter",
    "show": ""
  }, {
    "name": "appdotnet",
    "value": "",
    "title": "App.net",
    "show": ""
  }, {
    "name": "homepage",
    "value": "",
    "title": "Homepage",
    "show": ""
  }, {
    "name": "freenode",
    "value": "",
    "title": "IRC Handle",
    "show": ""
  }]
};

exports.blah = {
   "_id": "org.couchdb.user:blah",
   "_rev": "1-821953ad240c90ef437c0b2347bf8a00",
   "name": "blah",
   "roles": [
   ],
   "type": "user",
   "password_scheme": "pbkdf2",
   "derived_key": "c7bf5866f967d940eeb3142eb89f622ff6adbea9",
   "salt": "7547cc3cc579545aede05490c636d21ce3ec46928260bee6d83d8f52003d",
   "iterations": 10,
   "date": "2014-06-12T00:15:19.641Z",
   "verify": "12345",
   "email": "raquel@npmjs.com"
};

exports.boom = {
  "_id": "org.couchdb.user:boom",
  "_rev": "1-7adf7e546de1852cec39894c0d652fb4",
  "name": "boom",
  "roles": [],
  "type": "user",
  "password_scheme": "pbkdf2",
  "derived_key": "120282c09ab56981ae498477bf554079d230501f",
  "salt": "85794feca38d8fa85aae809b9fa420c2bf4ed91a4e43a979f3c9e9ad60b3",
  "iterations": 10,
  "date": "2014-07-21T20:16:41.055Z",
  "email": "boom@boom.com",
  "sid": "c53f9ebc"
};
