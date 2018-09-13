/*jshint node:true*/
module.exports = function(grunt) {

    var banner = '/*! ${name} ${version} (sha1: ${checksum})'
        + ' | (c) 2012~<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>.'
        + ' MIT License. | <%= pkg.homepage %> */\n';

    var version;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        version: version = {
            'amdr': {
                file: 'src/amdr.js',
                version: '<%= pkg.version %>'
            },
            'css': {
                file: 'src/loader/css.js',
                version: '<%= pkg.loaders.css.version %>'
            },
            'has': {
                file: 'src/loader/has.js',
                version: '<%= pkg.loaders.has.version %>'
            }
        },
        uglify: {
            'amdr': {
                src:  'src/amdr.js',
                dest: 'dist/amdr.js',
                options: {
                    banner: banner
                        .replace('${name}', 'AMDR')
                        .replace('${checksum}', '<%= version.amdr.checksum %>')
                        .replace('${version}', '<%= version.amdr.version %>')
                }
            },
            'css': {
                src:  'src/loader/css.js',
                dest: 'dist/loader/css.js',
                options: {
                    banner: banner
                        .replace('${name}', 'AMDR - CSS file loader')
                        .replace('${checksum}', '<%= version.css.checksum %>')
                        .replace('${version}', '<%= version.css.version %>')
                }
            },
            'has': {
                src:  'src/loader/has.js',
                dest: 'dist/loader/has.js',
                options: {
                    banner: banner
                        .replace('${name}', 'AMDR - Condition loader')
                        .replace('${checksum}', '<%= version.has.checksum %>')
                        .replace('${version}', '<%= version.has.version %>')
                }
            }
        },
        replace: {
            dist: {
                src: 'dist/**/*.js',
                overwrite: true,
                replacements: [{
                    from: /,!1([);]+)$/g,
                    to: ',/*@cc_on!@*/!1$1'
                }]
            }
        }
    });

    // Load tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.registerMultiTask('version', 'Update version in the source file.', function(){

        var pattern = /^(\/\*\!\s+\* [a-z -]+)(\s+[\d.]+)?(\s+\(sha1\: [a-z0-9]*\))?\n/i;
        var path = require('path');
        var task = this.data, checksum;

        if (!grunt.file.exists(task.file)) {
            grunt.log.warn('Source file ' + task.file + ' not found.');
            return;
        }

        if (!grunt.file.exists(path.dirname(task.file))) {
            grunt.file.mkdir(path.dirname(task.file));
        }

        var content = grunt.file.read(task.file);

        content = content.replace(pattern, '$1 ' + task.version + ' (sha1: )\n');
        content = content.replace(/((\(c\) )(\d+)~?)\d*/, function(m, $1, $2, $3){
            var year = '' + (new Date).getFullYear();
            return $2 + ($3 === year ? $3 : $3 + '~' + year);
        });
        content = content.replace(/\b(version(?::|\s*=)\s*)'(?:\d+\.)+\d+'/g, "$1'" + task.version + "'");

        checksum = require('crypto').createHash('sha1').update(content).digest('hex');
        content = content.replace(pattern, '$1 ' + task.version + ' (sha1: ' + checksum + ')\n');
        version[this.target].checksum = checksum;

        grunt.log.ok('Version of "' + task.file + '": ' + task.version + ' / ' + checksum);
        grunt.file.write(task.file, content);
    });


    // Define tasks.
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['version', 'uglify', 'replace']);

};
