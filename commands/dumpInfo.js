var request = require('request');
var fs = require('fs');

module.exports = function(data) {
  data.forEach(function(n) {
    // Each region holds an array of instances.
    n.forEach(function(i) {
      // Download the contents of this.
      var s = fs.createWriteStream('./' + i.dnsName + '.tar.gz');
      request('http://' + i.dnsName + ':8889/dump')
      .pipe(s)
      .on('end', function() {
        s.end();
      });
    });
  });
};
