const P = require('bluebird');
const freshy = require('freshy');
const fetch = freshy.freshy('node-fetch'); // Use a fresh copy since we modify it. Modifying shared things is rude.
fetch.Promise = P;

const bole = require('bole');
const logger = bole('EXTERNAL');
const emitter = require('../adapters/metrics')();
const moment = require('moment-tokens');

const url = require('url');

module.exports = function wrappedFetch(u, opts) {
  const parsedUrl = url.parse(u);
  const start = Date.now();
  return fetch(u, opts).tap(res => {
    const latency = Date.now() - start;

    emitter.metric({
      name: 'latency.external',
      value: latency,
      source: parsedUrl.host
    });

    logger.info(toCommonLogFormat(opts || {}, res, latency));
  }).catch(err => {
    logger.error(err);
    throw err;
  })
}

function toCommonLogFormat(opts, res, duration) {

  const method = opts.method || 'GET';

  const clientIp = '-',
    clientId = process.env.CANONICAL_HOST,
    userid = '-',
    time = `[${moment().strftime('%d/%b/%Y:%H:%M:%S %z')}]`,
    requestLine = `"${[opts.method || 'GET', res.url, 'HTTP/1.1'].join(' ')}"`,
    reqDuration = duration ? `${duration}ms` : '-';

  return [clientIp, clientId, userid, time, requestLine, res.statusCode, res.size, reqDuration].join(' ');
}
