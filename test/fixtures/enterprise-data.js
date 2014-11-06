exports.existingUser = {
  id: '12345',
  name: 'Boom Bam',
  email: 'exists@bam.com',
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  comments: 'teehee'
};

exports.newUser = {
  id: '23456',
  name: 'Boom Bam',
  email: 'new@bam.com',
  phone: '123-456-7890',
  company: 'npm, Inc.',
  numemployees: '1-25',
  comments: 'teehee'
};

exports.noLicenseUser = {
  id: 'noLicense@bam.com'
}

exports.tooManyLicensesUser = {
  id: 'tooManyLicenses@bam.com'
}

exports.licenseBrokenUser = {
  id: 'licenseBroken@bam.com'
}

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

exports.goodLicense = ['12-34-56'];
exports.tooManyLicenses = ['12-34-56', '78-90-12'];
exports.noLicense = [];