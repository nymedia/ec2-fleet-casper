'use strict';
var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = function(data) {
  data.forEach(function(n) {
    // Each region holds an array of instances.
    n.forEach(function(i) {
      // Download the contents of this.
      mkdirp('./dumps/' + i.dnsName, function(e) {
        var s = fs.createWriteStream('./dumps/' + i.dnsName + '/dump.tar.gz');
        request('http://' + i.dnsName + ':8889/dump')
        .pipe(s)
        .on('end', function() {
          s.end();
        });
      });
    });
  });
};
