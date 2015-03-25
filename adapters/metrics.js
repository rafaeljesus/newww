var
    assert  = require('assert'),
    Emitter = require('numbat-emitter'),
    os      = require('os'),
    emitter;

var metrics = module.exports = function constructEmitter()
{
    if (emitter) return emitter;

    emitter = new Emitter({
        uri: process.env.METRICS_URL || 'udp://localhost:3333',
        node: os.hostname()
    });
    return emitter;
};
