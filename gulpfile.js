var gulp = require('gulp'),
  nib = require('nib'),
  stylus = require('gulp-stylus'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  streamify = require('gulp-streamify'),
  bistre = require('bistre'),
  nodemon = require('gulp-nodemon'),
  rename = require('gulp-rename'),
  // imagemin = require('gulp-imagemin'),
  jshint = require('gulp-jshint'),
  pngcrush = require('imagemin-pngcrush');

var paths = {
  fonts: ['./assets/fonts/*'],
  styles: ['./assets/styles/**/*.styl'],
  images: ['./assets/images/**/*'],
  misc: ['./assets/misc/*'],
  scripts: {
    browserify: ["./assets/scripts/*.js"],
    vendor: ["./assets/scripts/vendor/*.js"],
    tota11y: ["./assets/scripts/tota11y.min.js"]
  },
  templates: ['./assets/templates/*.hbs'],
  lintables: [
    "./assets/scripts/**/*.js",
    "./adapters/**/*.js",
    "./facets/**/*.js",
    "./lib/**/*.js",
    "./locales/**/*.js",
    "./presenters/**/*.js",
    "./services/**/*.js",
    "./test/**/*.js",
  ]
};

gulp.task('watch', ['build'], function() {
  gulp.watch(paths.fonts, ['fonts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts.browserify, ['browserify']);
  gulp.watch(paths.templates, ['browserify']);
  gulp.watch(paths.scripts.vendor, ['concat']);
});

gulp.task('styles', function() {
  return gulp.src('./assets/styles/index.styl')
    .pipe(stylus({
      use: [nib()]
    }))
    .pipe(gulp.dest('static/css/'))
});

gulp.task('browserify', function() {
  return browserify("./assets/scripts/index.js")
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('static/js/'))
    .pipe(rename('index.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('static/js/'));
});

gulp.task('concat', function() {
  return gulp.src(paths.scripts.vendor)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('static/js/'))
});

gulp.task('tota11y', function() {
  return gulp
    .src(paths.scripts.tota11y)
    .pipe(gulp.dest('static/js/'));
});

gulp.task('fonts', function() {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('static/fonts'));
})

gulp.task('images', function() {
  return gulp.src(paths.images)
    // .pipe(imagemin({
    //     progressive: true,
    //     svgoPlugins: [{removeViewBox: false}],
    //     use: [pngcrush()]
    // }))
    .pipe(gulp.dest('static/images'));
})

gulp.task('misc', function() {
  return gulp.src(paths.misc)
    .pipe(gulp.dest('static/misc'));
})

gulp.task('nodemon', ['build'], function() {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs js',
    ignore: [
      'assets/',
      'facets/*/test/',
      'node_modules/',
      'static/',
      'test/',
    ],
    stdout: false,
  })
    .on('readable', function() {
      this.stdout
        .pipe(bistre({
          time: true
        }))
        .pipe(process.stdout);
      this.stderr
        .pipe(bistre({
          time: true
        }))
        .pipe(process.stderr);
    });
});

gulp.task('lint', function() {
  return gulp.src(paths.lintables)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('build', ['fonts', 'images', 'misc', 'styles', 'browserify', 'concat', 'tota11y']);
gulp.task('dev', ['build', 'nodemon', 'watch']);
gulp.task('default', ['build']);
