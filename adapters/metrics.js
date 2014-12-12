var
    Emitter = require('numbat-emitter'),
    os      = require('os'),
    emitter;

module.exports = function constructEmitter(options)
{
    if (emitter) return emitter;

    emitter = new Emitter({
        uri: options.uri,
        node: os.hostname()
    });
    return emitter;
};
