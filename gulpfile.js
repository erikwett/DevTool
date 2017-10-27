var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var runSequence = require('run-sequence');
var gutil = require('gulp-util');
var pkg = require('./package.json');

var DIST = './dist',
	SRC = './src',
	TMP = './tmp',
	MAIN = pkg.main.substring(0, pkg.main.indexOf('.')),
	NAME = pkg.name,
	DEPLOY = process.env.HOMEDRIVE + process.env.HOMEPATH + '/Documents/Qlik/Sense/Extensions/' + NAME;
gulp.task('js', function (ready) {
	return gulp.src(SRC + '/**/*.js')
		.pipe(gulp.dest(DIST));
});
gulp.task('qext', function () {
	var qext = {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
		type: 'visualization',
		author: pkg.author,
		icon: pkg.icon
	};
	var src = require('stream').Readable({ objectMode: true })
	src._read = function () {
		this.push(new gutil.File({
			cwd: "", base: "", path: MAIN + '.qext',
			contents: new Buffer(JSON.stringify(qext, null, 4))
		}));
		this.push(null);
	}
	return src.pipe(gulp.dest(DIST));
});

gulp.task('less', function () {
	var less = require('gulp-less');
	var LessPluginAutoPrefix = require('less-plugin-autoprefix');
	var autoprefix = new LessPluginAutoPrefix({
		browsers: ["last 2 versions"]
	});
	return gulp.src(SRC + '/**/*.less')
		.pipe(less({
			plugins: [autoprefix]
		}))
		.pipe(cssnano())
		.pipe(gulp.dest(DIST));
});

gulp.task('css', function () {
	return gulp.src(SRC + '/**/*.css')
		.pipe(cssnano())
		.pipe(gulp.dest(DIST));
});


gulp.task('clean', function (ready) {
	var del = require('del');
	del.sync([DIST, TMP]);
	ready();
});

gulp.task('zip-build', ['qext', 'less', 'css', 'js'], function () {
	var zip = require('gulp-zip');
	return gulp.src(DIST + '/**/*')
		.pipe(zip(NAME + '.zip'))
		.pipe(gulp.dest(DIST));
});

gulp.task('build', function () {
	return runSequence('clean',
		'zip-build'
	);
});

gulp.task('debug', ['less', 'qext', 'css', 'js'], function () {
	return gulp.src([DIST + '/**/*'])
		.pipe(gulp.dest(DEPLOY));
});

gulp.task('default', ['build']);
