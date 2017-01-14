let express = require('express');
let router = express.Router();
let multiparty = require('multiparty');
let fs = require('fs');
let unzip = require('unzip');
let mc = require('mongodb').MongoClient;
let MongoDb = require('../lib/db/mongo_db');
let MysqlDb = require('../lib/db/mysql_db');

let mg_path = require('../config.js').mg_path;
let mysql_option = require('../config.js').mysql_option;
let db = null;
if (mg_path)
  db = new MongoDb(mg_path);
else if (mysql_option)
  db = new MysqlDb(mysql_option);

let file_info = require('../lib/file_info');
let upload_csv = require('../lib/upload_csv');
let delete_folder = require('../lib/delete_folder');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'});
});

router.post('/upload', function (req, res, next) {
  var form = new multiparty.Form({uploadDir: './public/tmp'});
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log('upload error:' + err);
      res.send(500, 'Error when parse form');
    } else {
      res.send('Successfully Receive');
      console.log('upload files:');
      console.log(files.file);
      files.file.forEach(function (file) {
        var info = file_info(file.originalFilename);
        var specs = {
          label: null,
          timestamp: null
        };
        if (info.type == 'zip') {
          var uploadPath = file.path;
          var unzipPath = './public/files/' + info.colname;
          delete_folder(unzipPath);
          fs.createReadStream(uploadPath).pipe(unzip.Extract({
            path: unzipPath
          }).on('error', function () {
            console.log('Extract Error');
          }).on('finish', function () {
            console.log('Extract Finish');
            var readDir = fs.readdirSync(unzipPath);
            console.log('Extract Dir is');
            console.log(readDir);
            for (var dir in readDir) {
              console.log(unzipPath + '/' + readDir[dir]);
              if (fs.statSync(unzipPath + '/' + readDir[dir]).isFile()) {
                var finfo = file_info(readDir[dir]);
                if (finfo.type == 'csv')
                  if (finfo.colname in specs)
                    specs[finfo.colname] = unzipPath + '/' + readDir[dir];
              }
            }
            function upload(dir) {
              if (fs.statSync(unzipPath + '/' + readDir[dir]).isFile()) {
                var finfo = file_info(readDir[dir]);
                if (finfo.type == 'csv')
                  if (!(finfo.colname in specs))
                    upload_csv(info.colname + '_' + finfo.colname, unzipPath + '/' + readDir[dir], specs, db, function() {
                      if (dir < readDir.length) upload(dir + 1);
                    });
              }
            }
            if (readDir.length > 0)
              upload(0);
          }))
        } else if (info.type == 'csv') {
          upload_csv(info.colname, file.path, specs, db, function() {

          });
        }
      })
    }
  });
});

router.get('/name', function (req, res) {
  db.getCollectionList().then(function(items) {
    let mg_data = [];
    for (let i = 0; i < items.length; ++i)
      mg_data.push({value: items[i]});
    res.send(JSON.stringify(mg_data));
  })
});

router.get('/label', function (req, res) {
  let name = req.query.name;
  let shift = parseInt(req.query.shift);
  let start = parseInt(req.query.start);
  let end = parseInt(req.query.end);
  let num = parseInt(req.query.num);
  (function (name, shift, start, end, num) {
    function judgeStep(unit, size, num, global) {
      let step = unit;
      let times = 1000;
      if (global) {
        num = 1;
        times = Math.max(times, size / unit / 7);
      }
      while (size / step * num > times) {
        step = step * 2;
      }
      return step;
    }

    let global = false;
    if (isNaN(start) || isNaN(end))
      global = true;
    if (isNaN(shift))
      shift = 0;

    let data = {
      labels: [],
      global_max: null,
      global_min: null,
      step: null
    };
    shift = Math.round(shift / 1000);
    start = Math.round(start / 1000);
    end = Math.round(end / 1000);
    db.getSetting(name).then(function(setting) {
      data.global_max = setting.global_max;
      data.global_min = setting.global_min;
      data.step = setting.step;
      if (global) {
        end = data.global_max;
        start = data.global_min;
      }
      return judgeStep(data.step, end - start, num, global);
    }).then(function(step) {
      shift = Math.round(shift / data.step) * data.step;
      db.getCollection(name).then(function(col) {
        return col.getDocs(start, end, step, shift);
      }).then(function(labels) {
        data.labels = labels;
        data.global_max *= 1000;
        data.global_min *= 1000;
        data.step *= 1000;
        res.send(JSON.stringify(data));
        console.log(data);
      });
    });
  })(name, shift, start, end, num);
});

router.post('/mark', function (req, res) {
  var name = req.query.name;
  var start = parseInt(req.query.start);
  var end = parseInt(req.query.end);
  var op = req.query.op;
  start /= 1000;
  end /= 1000;
  (function (name, start, end, op) {
    console.log(start, end, op);
    db.getCollection(name).then(function(col) {
      return col.markInterval(start, end, op);
    }).then(function() {
      res.send(JSON.stringify("Successfully"));
    });
  })(name, start, end, op);


});

module.exports = router;
