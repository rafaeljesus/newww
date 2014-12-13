var
    Emitter = require('numbat-emitter'),
    os      = require('os'),
    emitter;

module.exports = function constructEmitter(options)
{
    console.log(options)

    if (emitter) return emitter;

    emitter = new Emitter({
        uri: options.collector.uri,
        node: os.hostname()
    });
    return emitter;
};
