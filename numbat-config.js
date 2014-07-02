module.exports = {

  logging: {
    name: 'numbat',
    console: true
  },

  listen: { host: 'localhost', port: 3333 },

  outputs: [
    {   // this one is run by us; for testing purposes
      type: 'influxdb',
      hosts: [
        { host: 'influx-1-west.internal.npmjs.com',  port: 8086 },
      ],
      username: 'grafana',
      password: 'showmethemetrics',
      database: 'metrics'
    },
    { type: 'log', name: 'numbat-1' }
  ]
};