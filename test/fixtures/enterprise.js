exports.existingUser = {
  id: 12345,
  name: 'Boom Bam',
  email: 'exists@bam.com',
  email_verified: true,
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  created: '2014-11-22T00:54:53.864Z',
  updated: '2015-03-13T00:09:47.632Z',
  deleted: null,
  verification_key: '12ab34cd-a123-4b56-789c-1de2deadbeef'
};

exports.newUser = {
  id: 23456,
  name: 'Boom Bam',
  email: 'new@bam.com',
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  comments: 'teehee',
  verification_key: '12ab34cd-a123-4b56-789c-1de2deafbead'
};

exports.noLicenseUser = {
  id: 'noLicense@bam.com'
};

exports.badLicenseUser = {
  id: 'badLicense@bam.com'
};

exports.tooManyLicensesUser = {
  id: 'tooManyLicenses@bam.com'
};

exports.licenseBrokenUser = {
  id: 'licenseBroken@bam.com'
};

exports.newTrial = {
  customer_id: 'exists@bam.com'
};

exports.noCustomerTrial = {
  customer_id: 'boom@bam.com'
};

exports.noLicenseTrial = {
  customer_id: 'noLicense@bam.com'
};

exports.tooManyLicensesTrial = {
  customer_id: 'tooManyLicenses@bam.com'
};

exports.licenseBrokenTrial = {
  customer_id: 'licenseBroken@bam.com'
};

exports.goodLicense = {
  licenses: [
    {
      id: 609,
      customer_id: 123,
      plan_id: null,
      license_key: '0feed16c-0f28-4911-90f4-dfe49f7bfb41',
      seats: 50,
      begins: '2015-03-11T21:53:40.150Z',
      ends: '2015-04-10T21:53:40.150Z',
      created: '2015-03-11T22:00:41.088Z',
      updated: '2015-03-11T22:00:41.088Z'
    }
  ]
};

exports.onSiteLicense = {
  details: {
    id: 619,
    customer_id: 123,
    product_id: '12-34-56',
    plan_id: null,
    license_key: '9b0ed7f8-ac3a-408a-8821-86be0426ea76',
    seats: 5,
    begins: '2015-03-12T17:02:44.000Z',
    ends: '2016-03-12T17:02:44.000Z',
    created: '2015-03-13T00:09:48.209Z',
    updated: '2015-03-13T00:09:48.209Z'
  },
  signature: 'some-long-string'
};

exports.newLicense = [
  {
    id: 609,
    customer_id: 345,
    plan_id: null,
    license_key: '0feed16c-0f28-4911-90f4-dfe49f7bfb41',
    seats: 50,
    begins: '2015-03-11T21:53:40.150Z',
    ends: '2015-04-10T21:53:40.150Z',
    created: '2015-03-11T22:00:41.088Z',
    updated: '2015-03-11T22:00:41.088Z'
  }
];

exports.tooManyLicenses = {
  licenses: [
    {
      id: 609,
      customer_id: 123,
      plan_id: null,
      license_key: '0feed16c-0f28-4911-90f4-dfe49f7bfb41',
      seats: 50,
      begins: '2015-03-11T21:53:40.150Z',
      ends: '2015-04-10T21:53:40.150Z',
      created: '2015-03-11T22:00:41.088Z',
      updated: '2015-03-11T22:00:41.088Z'
    },
    {
      id: 610,
      customer_id: 123,
      plan_id: null,
      license_key: '5abd5f47-8199-464d-baed-3c4243086862',
      seats: 40,
      begins: '2015-03-11T21:54:18.000Z',
      ends: '2016-03-11T21:54:18.000Z',
      created: '2015-03-11T22:01:19.237Z',
      updated: '2015-03-11T22:01:19.237Z'
    },
    {
      id: 611,
      customer_id: 123,
      plan_id: null,
      license_key: '14facf9e-c7c9-4f9a-ba10-7baa83ae8777',
      seats: 100,
      begins: '2015-03-11T22:24:58.000Z',
      ends: '2016-03-11T22:24:58.000Z',
      created: '2015-03-11T22:31:59.867Z',
      updated: '2015-03-11T22:31:59.867Z'
    }
  ]
};

exports.noLicense = {
  licenses: []
};

exports.stripeCustomer = {
  object: 'customer',
  created: 1426198433,
  id: 'cus_123abc',
  livemode: false,
  description: 'exists@boom.com npm On-Site Starter Pack',
  email: 'exists@boom.com',
  delinquent: false,
  metadata: {},
  subscriptions: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/subscriptions',
    data: [{
      id: '1234567890'
    }]
  },
  discount: null,
  account_balance: 0,
  currency: 'usd',
  cards: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/cards',
    data: [[Object]]
  },
  default_card: 'card_15feYq4fnGb60djYJsvT2YGG',
  sources: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/sources',
    data: [[Object]]
  },
  default_source: 'card_15feYq4fnGb60djYJsvT2YGG'
};

exports.buyLicensePayload = {
  id: 'tok_12345',
  livemode: 'false',
  created: '1426198429',
  used: 'false',
  object: 'token',
  type: 'card',
  card: {},
  email: 'exists@boom.com',
  verification_allowed: 'true',
  client_ip: 'localhost',
  amount: '2500',
  subType: '1',
  quantity: '1',
  customerId: '12345'
};

