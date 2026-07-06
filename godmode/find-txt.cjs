const fs = require('fs');
const path = require('path');
function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.txt') || file.endsWith('.md')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
walk(__dirname, (err, res) => console.log(res.join('\n')));
