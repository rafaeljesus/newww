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
    rename = require('gulp-rename');

gulp.task('styles', function () {
  gulp.src('./assets/stylus/index.styl')
    .pipe(stylus({use: [nib()]}))
    .pipe(gulp.dest('static/css/'))
});

gulp.task('browserify', function () {
  browserify('./assets/js/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('static/js/'))
    .pipe(rename('index.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('static/js/'));

});

gulp.task('concat', function () {
  gulp.src(["assets/js/vendor/*.js"])
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('static/js/'))
});

gulp.task('develop', function () {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs styl js',
    ignore: ['node_modules/', 'test/', 'facets/*/test/', 'static/'],
    stdout: false
  })
    .on('change', ['build'])
    .on('restart', function () {
      console.log('restarted!')
    })
    .on('readable', function () {
      this.stdout
        .pipe(bistre({time: true}))
        .pipe(process.stdout);
      this.stderr
        .pipe(bistre({time: true}))
        .pipe(process.stderr);
    })
});

gulp.task('build', ['styles', 'browserify', 'concat']);
gulp.task('default', ['build']);
