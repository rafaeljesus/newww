var
    assert  = require('assert'),
    Emitter = require('numbat-emitter'),
    os      = require('os'),
    emitter;

var metrics = module.exports = function constructEmitter()
{
    if (emitter) return emitter;

    emitter = new Emitter({
        uri: 'udp://localhost:3333',
        node: os.hostname()
    });
    return emitter;
};
