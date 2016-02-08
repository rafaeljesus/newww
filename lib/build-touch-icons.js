var favicons = require('favicons');

var options = {
  appDescription: 'The npm website', // Your application's description. `string`
  appName: 'npm', // Your application's name. `string`
  background: '#cb3837', // Background colour for flattened icons. `string`
  developerName: 'npm, Inc.', // Your (or your developer's) name. `string`
  developerURL: 'https://www.npmjs.com', // Your (or your developer's) URL. `string`
  // TODO(@jonathanmarvens): Make sure `url` is pointing to a URL for an Open Graph image.
  display: 'standalone', // Android display: "browser" or "standalone". `string`
  icons: {
    android: true, // Create Android homescreen icon. `boolean`
    appleIcon: true, // Create Apple touch icons. `boolean`
    appleStartup: true, // Create Apple startup images. `boolean`
    coast: true, // Create Opera Coast icon. `boolean`
    favicons: true, // Create regular favicons. `boolean`
    firefox: true, // Create Firefox OS icons. `boolean`
    opengraph: true, // Create Facebook OpenGraph image. `boolean`
    twitter: true, // Create Twitter Summary Card image. `boolean`
    windows: true, // Create Windows 8 tile icons. `boolean`
    yandex: true // Create Yandex browser icon. `boolean`
  },
  logging: false, // Print logs to console? `boolean`
  online: false, // Use RealFaviconGenerator to create favicons? `boolean`
  orientation: 'portrait', // Android orientation: "portrait" or "landscape". `string`
  path: '/static/images/touch-icons', // Path for overriding default icons path. `string`
  url: 'https://www.npmjs.com', // Absolute URL for OpenGraph image. `string`
  version: '1.0' // Your application's version number. `number`
};

favicons('./assets/images/touch_icon.png', options, function (error, result) {
  if (error) {
    throw error;
  }

  console.log('done generating touch icons');
});
