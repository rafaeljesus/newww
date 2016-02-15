const gulp = require('gulp');
const nib = require('nib');
const stylus = require('gulp-stylus');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const streamify = require('gulp-streamify');
const bistre = require('bistre');
const nodemon = require('gulp-nodemon');
const rename = require('gulp-rename');
const jshint = require('gulp-jshint');
const RevAll = require('gulp-rev-all');
const gutil = require('gulp-util');

const revAll = new RevAll();
const paths = {
  fonts: ['./assets/fonts/*'],
  styles: ['./assets/styles/**/*.styl'],
  images: ['./assets/images/**/*'],
  misc: ['./assets/misc/*'],
  scripts: {
    browserify: ['./assets/scripts/*.js'],
    vendor: ['./assets/scripts/vendor/*.js'],
    tota11y: ['./assets/scripts/tota11y.min.js']
  },
  templates: ['./assets/templates/*.hbs'],
  lintables: [
    './assets/scripts/**/*.js',
    './adapters/**/*.js',
    './facets/**/*.js',
    './lib/**/*.js',
    './locales/**/*.js',
    './presenters/**/*.js',
    './services/**/*.js',
    './test/**/*.js',
  ]
};

gulp.task('watch', ['dev-build'], () => {
  gulp.watch(paths.fonts, ['fonts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts.browserify, ['browserify']);
  gulp.watch(paths.templates, ['browserify']);
  gulp.watch(paths.scripts.vendor, ['concat']);
});

gulp.task('styles', () => {
  return gulp.src('./assets/styles/index.styl')
    .pipe(stylus({
      use: [nib()]
    }))
    .on('error', gutil.log)
    .pipe(gulp.dest('static/css/'));
});

gulp.task('browserify', () => {
  return browserify('./assets/scripts/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('static/js/'))
    .pipe(rename('index.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('static/js/'));
});

gulp.task('concat', () => {
  return gulp.src(paths.scripts.vendor)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('static/js/'))
});

gulp.task('tota11y', () => {
  return gulp
    .src(paths.scripts.tota11y)
    .pipe(gulp.dest('static/js/'));
});

gulp.task('fonts', () => {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('static/fonts'));
})

gulp.task('images', () => {
  return gulp.src(paths.images)
    // .pipe(imagemin({
    //     progressive: true,
    //     svgoPlugins: [{removeViewBox: false}],
    //     use: [pngcrush()]
    // }))
    .pipe(gulp.dest('static/images'));
})

gulp.task('misc', () => {
  return gulp.src(paths.misc)
    .pipe(gulp.dest('static/misc'));
})

gulp.task('nodemon', ['dev-build'], function() {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs js',
    ignore: [
      'assets/',
      'templates/',
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

gulp.task('lint', () => {
  return gulp.src(paths.lintables)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('rev', ['browserify', 'styles'], () => {
  return gulp.src(['static/js/index.js', 'static/js/index.min.js', 'static/css/index.css', 'static/js/vendor.min.js'])
    .pipe(revAll.revision())
    .pipe(gulp.dest('static'))
    .pipe(revAll.manifestFile())
    .pipe(gulp.dest('static'));
});

gulp.task('dev-build', ['fonts', 'images', 'misc', 'styles', 'browserify', 'concat']);
gulp.task('prod-build', ['dev-build', 'rev']);
gulp.task('build', ['prod-build']);
gulp.task('dev', ['dev-build', 'tota11y', 'nodemon', 'watch']);
gulp.task('default', ['build']);
