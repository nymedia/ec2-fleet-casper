'use strict';
var http = require('http');
var request = require('request');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var fs = require('fs');
var util = require('util');
var spawn = require('child_process').spawn;

var config = {};
var stats = {};
var lastStatus = {};
function reset(s) {
  // Keeping lastStatus, for displaying in the "top" utility.
  lastStatus = s;
  config = {
    n: 0,
    concurrency: 1,
    controlPort: 8889,
    testScript: config.testScript || ''
  };
  stats = {
    clients: 0,
    inproc: 0,
    errors_req: 0,
    ended_req: 0,
    has_script: stats.has_script || false
  };
}
reset();


var clients = {};

function getScript() {
  console.log('downloading script from ' + config.testScript);
  stats.has_script = false;
  var s = fs.createWriteStream('./casper/casperscript.js');
  request(config.testScript)
  .on('end', function() {
    stats.has_script = true;
    console.log('downloaded script from ' + config.testScript);
    s.end();
  })
  .pipe(s);
}

function startCaspers() {
  stats.inproc += 1;
  stats.clients += 1;
  var id = Math.random().toString(36).slice(2);
  var c = spawn('casperjs', [
    '--ignore-ssl-errors=true',
    '--log-level=error',
    '--ssl-protocol=tlsv1',
    'casper/casperscript.js',
    id
  ]);
  var out = fs.createWriteStream('casper/out.log', {
    'flags': 'a'
  });

  var log = function(type, message) {
    var m = {
      type: type,
      message: message,
      date: Date.now(),
      id: id
    };
    out.write(JSON.stringify(m) + "\n");
  };

  c.stdout.on('data', function(d) {
    d.toString().split("\n").forEach(function(n) {
      if (!n || !n.length) {
        return;
      }
      log('debug', n);
    });
  });
  c.stderr.on('data', function(d) {
    log('error', d);
  });
  c.on('close', function(c) {
    log('exit', util.format('Ended with status code %d' + "\n", c));
    stats.inproc--;
    stats.clients--;
    stats.ended_req++;
    if (c !== 0) {
      stats.errors_req++;
    }
    out.end();
  });
}

// Controlling loop.
setInterval(function() {
  if (stats.ended_req >= config.n) {
    if (stats.ended_req > 0) {
      // Reset stats if we have finished testing. Unless there are some clients
      // that just happened to arrive late.
      if (stats.clients < 0 || stats.inproc < 0) {
        // Meh.
      }
      else {
        reset(stats);
      }
    }
    return;
  }
  // Make connections if needed.
  while (config.n > stats.clients + stats.inproc &&
         stats.inproc < config.concurrency) {
    startCaspers();
  }

  // Abort connections if needed.
  if (config.n < stats.clients) {
    var keys = Object.keys(clients).slice(0, stats.clients-config.n);
    for (var i = 0; i < keys.length; i++) {
      clients[keys[i]].abort();
      stats.clients--;
      delete clients[keys[i]];
    }
  }
}, 100);

// Output stats to console for debugging.
// With upstart job, it ends up in /var/log/upstart/client.log.
console.log("==== Client Started ===== Time: "+new Date().toISOString());
setInterval(function() {
  console.log(JSON.stringify(stats));
}, 1000);

// Controlling server.
http.createServer(function (req, res) {
  if (req.method === "GET") {
    var url = require('url').parse(req.url, true);

    if (url.pathname === '/') {
      // Return stats on '/'
      return res.end(JSON.stringify({stats: stats, lastStatus: lastStatus}) + "\n");
    }
    else if (url.pathname === '/set') {
        // Set params on '/set', preserving the type of param.
        for (var key in url.query) {
          if (url.query.hasOwnProperty(key)) {
            var value = url.query[key];
            if (typeof config[key] === 'number') {
              value = parseInt(url.query[key], 10);
            }
            config[key] = value;
            if (key === 'testScript') {
              getScript();
            }
          }
        }
        var response = config;
        response.date = new Date().toString();
        return res.end(JSON.stringify(response) + "\n");

    }
    else if (url.pathname === '/restart') {
      // Restart process on '/restart'
      require('child_process').exec("sudo restart client", function() {});
      return res.end("OK\n");
    }
    else if (url.pathname === '/dump') {
      // Compress all casper data and dump back to user.
      return fstream.Reader({ 'path': './casper/', 'type': 'Directory' })
      .pipe(tar.Pack())
      .pipe(zlib.Gzip())
      .pipe(res);
    }
  }
  res.writeHead(404);
  return res.end();
}).listen(config.controlPort);
