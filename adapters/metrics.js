var
    assert  = require('assert'),
    Emitter = require('numbat-emitter'),
    os      = require('os'),
    emitter;

module.exports = function constructEmitter(options)
{
    if (emitter) return emitter;

    assert(options, 'you must pass an options object to constructEmitter()');

    emitter = new Emitter({
        uri: options.collector.uri,
        node: os.hostname()
    });
    return emitter;
};
