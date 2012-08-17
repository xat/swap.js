module.exports = function(grunt) {
  grunt.initConfig({
    min: {
      min: {
        src: ['swap.js'],
        dest: 'swap.min.js'
      }
    },
    lint: {
      files: ['swap.js']
    }
  });

  grunt.registerTask('default', 'min lint');
};
