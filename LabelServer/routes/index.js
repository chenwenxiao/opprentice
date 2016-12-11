var express = require('express');
var router = express.Router();

var mg_url = 'mongodb://localhost:27017/opprentice';
var mc = require('mongodb').MongoClient;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'});
});

router.get('/name', function (req, res) {
  mc.connect(mg_url, function (err, db) {
    db.listCollections().toArray(function (err, items) {
      var data = [];
      for (var i = 0; i < items.length; ++i)
        data.push({value: items[i].name});
      console.log(data);
      res.send(JSON.stringify(data));
      db.close();
    });
  });

});

router.get('/label', function (req, res) {
  var name = req.query.name;
  var shift = parseInt(req.query.shift);
  var start = parseInt(req.query.start);
  var end = parseInt(req.query.end);
  var num = parseInt(req.query.num);
  (function (name, shift, start, end, num) {
    function judgeStep(unit, size, num, global) {
      var step = unit;
      var times = 1000;
      if (global) {
        num = 1;
        times = Math.max(times, size / unit / 7);
      }
      while (size / step * num > times) {
        step = step * 2;
      }
      return step;
    }

    mc.connect(mg_url, function (err, db) {
      var global = false;
      if (isNaN(start) || isNaN(end))
        global = true;
      if (isNaN(shift))
        shift = 0;

      var data = {
        labels: [],
        global_max: null,
        global_min: null,
        step: null
      };
      shift = Math.round(shift / 1000);
      start = Math.round(start / 1000);
      end = Math.round(end / 1000);
      db.collection(name).findOne({
        _setting: true
      }).then(function (setting) {
        data.global_max = setting.global_max;
        data.global_min = setting.global_min;
        data.step = setting.step;
      }).then(function () {
        if (global) {
          end = data.global_max;
          start = data.global_min;
        }
        return judgeStep(data.step, end - start, num, global);
      }).then(function (step) {
        shift = Math.round(shift / data.step) * data.step;
        var residual = (step - (shift % step)) % step;
        console.log({
          timestamp: {
            $mod: [step, residual],
            $gte: start - shift,
            $lte: end - shift
          }
        });
        db.collection(name).find({
          timestamp: {
            $mod: [step, residual],
            $gte: start - shift,
            $lte: end - shift
          }
        }, {sort: {timestamp: 1}}).toArray(function (err, items) {
          for (var i = 0; i < items.length; ++i)
            data.labels.push([(items[i].timestamp + shift) * 1000, items[i].value, items[i].label == null ? 0 : items[i].label]);
          data.global_max *= 1000;
          data.global_min *= 1000;
          data.step *= 1000;
          res.send(JSON.stringify(data));
          console.log(data.labels.length);
          db.close();
        });
      });
    });
  })(name, shift, start, end, num);
});

router.post('/mark', function (req, res) {
  var name = req.query.name;
  var start = parseInt(req.query.start);
  var end = parseInt(req.query.end);
  var op = req.query.op;

  (function (name, start, end, op) {
    console.log(start, end, op);

    mc.connect(mg_url, function (err, db) {
      start /= 1000;
      end /= 1000;
      console.log(op);
      if (op == 'true') {
        console.log('1', start, end);
        db.collection(name).updateMany({
          timestamp: {
            $gte: start,
            $lte: end
          }
        }, {$set: {label: 1}});
      } else if (op == 'false') {
        console.log('0', start, end);
        db.collection(name).updateMany({
          timestamp: {
            $gte: start,
            $lte: end
          }
        }, {$set: {label: 0}});
      }
      res.send(JSON.stringify("Successfully"));
    });

  })(name, start, end, op);


});

module.exports = router;
