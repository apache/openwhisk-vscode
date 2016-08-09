var gulp = require('gulp');
var zip = require('gulp-vinyl-zip').zip;

gulp.task('build-zip', () => {
	const platform = process.platform;

	return gulp.src([
		'static-src/commands/**',
		'static-src/templates/**',
		'static-src/extension.js',
		'node_modules/**',
		'LICENSE',
		'package.json',
		'github-assets/**',
		'README.md',
		'!node_modules/.bin/**',
		'!node_modules/**/.bin'
	], { base: '.' })
		.pipe(zip(`openwhisk-vscode-${platform}.zip`))
		.pipe(gulp.dest('./out'));
});