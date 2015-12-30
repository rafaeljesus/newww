const P = require('bluebird');
const freshy = require('freshy');
const fetch = freshy.freshy('node-fetch'); // Use a fresh copy since we modify it. Modifying shared things is rude.
fetch.Promise = P;

module.exports = fetch;
