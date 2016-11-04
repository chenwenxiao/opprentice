var express = require('express');
var router = express.Router();
var fs = require('fs')

/* GET users listing. */
router.get('/', function(req, res, next) {
  var path = decodeURI(req.query.path) + "/report.html";
  console.log(path)
  var html = fs.readFile(path, function(err, data){
    if (err) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.write(data);
      res.end();
    }
  });
});

module.exports = router;
