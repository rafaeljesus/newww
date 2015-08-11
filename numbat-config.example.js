module.exports = {

  logging: {
    name: 'numbat',
    console: true
  },

  listen: {
    host: '0.0.0.0',
    port: 3333
  },

  outputs: [
    // {
    //   type: 'dbtype',
    //   hosts: [
    //     { host: 'your-host-file',  port: 8086 },
    //   ],
    //   username: 'username',
    //   password: 'password',
    //   database: 'database'
    // },
    {
      type: 'log',
      name: 'numbat-1'
    }
  ]
};