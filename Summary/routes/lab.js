var express = require('express');
var router = express.Router();
var fs = require('fs');

report_path = '../train';

/* GET home page. */
router.get('/', function(req, res, next) {
  function walk(path, handleFile) {
    fs.readdir(path, function(err, files) {
      if (err) {
        console.log('read dir error');
      } else {
        files.forEach(function(item) {
          var tmpPath = path + '/' + item;
          fs.lstat(tmpPath, function(err1, stats) {
            if (err1) {
              console.log('stat error');
            } else {
              if (stats.isDirectory()) {
                walk(tmpPath, handleFile);
              } else {
                handleFile(item, path);
              }
            }
          })
        });
      }
    });
  }
  data = []
  walk(report_path, function(version, root) {
    if (version == 'version') {
      walk(root, function(item, path) {
        if (item == 'report.html') {
          fs.lstat(path, function(err1, stats) {
            if (err1) {
              console.log('stat error');
            } else {
              name = path;
              while (name.length > 2 && name.slice(0, 3) == '../')
                name = name.substr(3)
              if (stats.isSymbolicLink()) {
                data.push({
                  id: data.length,
                  name: name,
                  path: path
                });
              } else {
                data.push({
                  id: data.length,
                  name: name,
                  path: path
                });
              }
            }
          })
        }
      })
    }
  })
  setTimeout(function(){
    console.log(JSON.stringify(data));
    res.send(JSON.stringify(data));
  }, 150);
});

module.exports = router;
