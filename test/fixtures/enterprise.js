exports.existingUser = {
  id: 12345,
  name: 'Boom Bam',
  email: 'exists@bam.com',
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  comments: 'teehee'
};

exports.newUser = {
  id: 23456,
  name: 'Boom Bam',
  email: 'new@bam.com',
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  comments: 'teehee'
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
  customer_id: 'exists@bam.com',
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

exports.goodLicense = [
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
];

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

exports.tooManyLicenses = [
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
];

exports.noLicense = [];