<template>
  <div>
    <div id="container" style="width:100%; height:960px;"></div>
    <globalbar ref="globalbar"
              @update="update"/>

    <el-dialog title="数据列表" v-model="series.visible" size="tiny">
      <el-form :model="series">
        <el-form-item v-for="(name, index) in series.names" :label="'数据' + index" label-width="60px">
          <el-col :span="10">
            <el-autocomplete
              class="inline-input"
              v-model="series.names[index]"
              :fetch-suggestions="querySearch"
              placeholder="请输入数据名称"
              :trigger-on-focus="false">
            </el-autocomplete>
          </el-col>
          <el-col :span="8">
            <el-input
              placeholder="请输入偏移量"
              v-model="series.shifts[index]">
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click.prevent="removeSeries(index)">删除</el-button>
          </el-col>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelSeries">取 消</el-button>
        <el-button @click="addSeries">新增数据</el-button>
        <el-button type="primary" @click="confirmSeries">确 定</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script>
  import Highcharts from 'highcharts/highstock';
  import theme from './theme.js'
  // import theme from 'highcharts/themes/dark-unica';
  import jquery from 'jquery';
  import GlobalBar from './GlobalBar.vue';

  theme(Highcharts);

  var _minute = 1000 * 60;
  var _hour = 1000 * 60 * 60;
  var _day = 1000 * 60 * 60 * 24;
  var _week = 1000 * 60 * 60 * 24 * 7;
  var _month = 1000 * 60 * 60 * 24 * 30;
  var _year = 1000 * 60 * 60 * 24 * 365;
  
  var marks = {};
  marks['sin'] = [];
  marks['cos'] = [];
  var STORAGE_KEY = 'labels-vuejs-2.0'
  var labelStorage = {

    getNames: function(App) {
      return App.$http.get('/name').then(function(res) {
        return res.data;
      }, function(res) {
        return [{
          value: 'sin'
        }, {
          value: 'cos'
        }];
      });
    },

    virtual_get: function(name, index) {
      var flag = 0;
      for (var i = 0; i < marks[name].length; ++i)
        if (marks[name][i][0] <= index && index <= marks[name][i][1])
          flag = !flag;
      var y = 0;
      if (name == 'sin')
        y = Math.sin(index * 1.0 / 6000000);
      else if (name == 'cos')
        y = Math.cos(index * 1.0 / 6000000)
      return [index, y, flag];
    },

    fetch: function (App, start=0, end=0, strict=false) {
      console.log('fetch(' + start + ',' + end + ')');
      var LS = this;
      var pros = [];
      if (start == 0 && end == 0) {
        console.log(App.names)
        for (var i = 0; i < App.names.length; ++i) {
          pros.push((function(i) {
            return App.$http.get('/label?name=' + App.names[i] + '&shift=' + App.shifts[i]).then(function(res) {
              var json = JSON.parse(res.data);
              App.labels[i] = json.labels;
              if (i == 0) {
                App.global_max = App.labels[App.labels.length - 1][0];
                App.global_min = App.labels[0][0];
                App.globalType = utils.judgeExtremeType(App.global_min, App.global_max);
                if (App.globalType == 'month' || App.globalType == 'year') {
                  App.window_max = App.global_min + _week;
                  App.window_min = App.global_min;
                } else {
                  App.window_max = App.global_max;
                  App.window_min = App.global_min;
                }
              }
              return App.labels[i];
            }, function(res) {
              App.labels[i] = [];
              var labels = App.labels[i];

              var start = 1258675200000;
              var end = 1258675200000 + 100000 * 60 * 1000;
              var step = utils.judgeStep(end - start, App.names.length);

              var istart = Math.round(start / step) * step;
              var iend = Math.round(end / step) * step;
              for (var j = istart; j <= iend; j += step) {
                var tmp = labelStorage.virtual_get(App.names[i], j - parseInt(App.shifts[i]));
                tmp[0] += parseInt(App.shifts[i]);
                App.labels[i].push(tmp);
              }
              if (i == 0) {
                App.global_max = labels[labels.length - 1][0];
                App.global_min = labels[0][0];
                App.globalType = utils.judgeExtremeType(App.global_min, App.global_max);
                if (App.globalType == 'month' || App.globalType == 'year') {
                  App.window_max = App.global_min + _week;
                  App.window_min = App.global_min;
                } else {
                  App.window_max = App.global_max;
                  App.window_min = App.global_min;
                }
              }
              console.log(App.window_max, App.window_min, App.global_max, App.global_min)
              return labels;
            });
          })(i));
        }
      } else {
        console.log('Interval Init');

        App.reset = true;
        var step = utils.judgeStep(end - start, App.names.length);
        var exstart = Math.max(App.global_min, start - 500 * step);
        var exend = Math.min(App.global_max, end + 500 * step);

        var drstart = Math.max(App.global_min, start - 300 * step);
        var drend = Math.min(App.global_max, end + 300 * step);

        var istart = Math.round(drstart / step) * step;
        var iend = Math.round(drend / step) * step;
        if (LS.step == step && LS.istart <= istart && LS.iend >= iend && !strict) {
          return Promise.resolve(false);
        } else {
          App.labels = [];
          for (var i = 0; i < App.names.length; ++i)
            App.labels.push([]);
          istart = Math.round(exstart / step) * step;
          iend = Math.round(exend / step) * step;
          LS.istart = istart, LS.iend = iend;
          LS.step = step;

          //App.chart.showLoading('Loading data from server...');
          for (var i = 0; i < App.names.length; ++i)
            pros.push((function(i, istart, iend) {
              return App.$http.get('/label?name=' + App.names[i] + '&start=' + start + '&end=' + end + '&shift=' + App.shifts[i]).then(function(res) {
                App.labels[i] = JSON.parse(res.data);
                return App.labels[i];
              }, function(res) {
                console.log('Get Data');
                for (var j = istart; j <= iend; j += step) {
                  var tmp = labelStorage.virtual_get(App.names[i], j - parseInt(App.shifts[i]));
                  tmp[0] += parseInt(App.shifts[i]);
                  App.labels[i].push(tmp);
                }
                return App.labels[i];
              });
            })(i, istart, iend));
        }
      }
      return Promise.all(pros).then(function() {
        return true;
      });
    },

    reload: function(App, chart, start, end, strict=false) {
      return labelStorage.fetch(App, start, end, strict).then(function(res) {
        console.log('Hide')
        if (res) {
          console.log(App.labels);
          console.log(App.chart.series)
          for (var i = 0; i < App.labels.length; ++i)
            chart.series[i].setData(App.labels[i]);
          // chart.hideLoading();
          for (var i = 0; i < App.labels.length; ++i) {
            chart.series[i].zones = utils.judgeZones(App.labels[i], chart.series[i].color);
            chart.series[i].show();
          }
          console.log('Finish Reload')
        }
      });
    },

    save: function (App, name, start, end) {
      return App.$http.post('/mark?name=' + name + 'start=' + start + '&end=' + end).then(function(res) {
        for (var i = 0; i < App.labels.length; ++i)
          if (start <= App.labels[i][0] && App.labels[i][0] <= end)
            App.labels[i][2] = !App.labels[i][2];
        return App.labels;
      }, function(res) {
        marks[name].push([start, end]);
        for (var i = 0; i < App.labels.length; ++i)
          if (start <= App.labels[i][0] && App.labels[i][0] <= end)
            App.labels[i][2] = !App.labels[i][2];
        return App.labels;
      })
    }
  }

  var filters = {
    all: function (labels) {
      return labels
    },

    positive: function(labels) {
      return labels.filter(function (labels) {
        return labels.label == true
      })
    },
    
    unpositive: function(labels) {
      return labels.filter(function (labels) {
        return labels.label == false
      })
    },

    label: function (labels, flag) {
      return labels.filter(function (labels) {
        return labels.label == flag
      })
    }
  }

  var utils = {
    judgeZones: function(labels, defaultColor) {
      var zones = [];
      var last = 0;
      for (var i = 0; i < labels.length; ++i) {
        if (labels[i][2] != last) {
          zones.push({
            value: labels[i][0] - 30 * 1000,
            color: last > 0 ? '#f45b5b' : defaultColor
          });
          last = labels[i][2];
        }
      }
      zones.push({color: defaultColor});
      console.log(zones)
      return zones;
    },

    binarySearch: function(data, dest) {
      //find the smallest index in data whose value is large than dest
      var h = data.length - 1, l = 0;
      if (dest > data[h])
        return h + 1;
      while (l < h) {
        var m = Math.floor((h + l) / 2);
        if (dest > data[m][0]) {
          l = m + 1;
        } else {
          h = m;
        }
      }
      return l;
    },
    judgeExtremeType: function(min, max) {
      //judge the extrme type, including day, week, month. year
      var size = max - min;
      if (size <= _day)
        return 'day';
      else if (size <= _week)
        return 'week';
      else if (size <= _month)
        return 'month';
      else
        return 'year';
    },
    judgeStep: function(size, nums) {
      var step = 1000 * 60;
      while (size / step > 2000) {
        step = step * 2;
      }
      return step;
    }

  }

  export default {
    data() {
      return {
        labels: [],
        names: [],
        shifts: [],
        allNames: [],
        extremeType: null,
        global_max: 0,
        global_min: 0,
        window_max: 0,
        window_min: 0,
        series: {
          visible: false,
          names: [],
          shifts: []
        },
        chart: null
      }
    },

    mounted() {
      var App = this;
      App.names = window.names;
      App.shifts = window.shifts;
      labelStorage.getNames(App).then(function(names) {
        App.allNames = names;
      });
      this.init();

    },

    watch: {
      '$route' (to, from) {
      },
    },

    computed: {

    },

    filters: {

    },

    methods: {
      init: function() {
        var App = this;
        App.labels = [];
        for (var i = 0; i < App.names.length; ++i)
          App.labels.push([]);
        labelStorage.fetch(App).then(function() {
          var container = jquery('#container')[0];
          var pre_series = [];
          console.log(App.labels)
          for (var i = 0; i < App.labels.length; ++i)
            pre_series.push({
                name: App.names[i],
                data: App.labels[i], 
                zoneAxis: 'x',
                zones: [],
                showInNavigator: true
            });
          console.log(pre_series);
          var option = {
            chart: {
              type: 'spline',
              zoomType: 'x',
              events: {
                load: function() {
                  this.xAxis[0].setExtremes(App.window_min, App.window_max);        
                  this.xAxis[0].update({
                      min: App.window_min,
                      max: App.window_max
                  });
                },
                selection: function(e) {
                  if (e.xAxis) {
                    console.log(App.extremeType)
                    if (App.extremeType == 'day') {
                      labelStorage.save(App, App.names[0], e.xAxis[0].min, e.xAxis[0].max).then(function(res) {
                        labelStorage.reload(App, App.chart, Math.round(App.chart.xAxis[0].min), Math.round(App.chart.xAxis[0].max), true);
                      });
                    } else {

                    }
                  }
                  return false;
                }
              }
            },
            legend: {
              enabled: true,
              itemStyle: {
                  fontSize: '1em',
                  fontStyle: 'normal',
                  fontWeight: 'bold'
              },
              symbolRadius: 0,
              symbolWidth: 16
            },
            rangeSelector: {
              inputBoxWidth: 120,
              buttons: [{
                type: 'hour',
                count: 1,
                text: '1h'
              }, {
                type: 'hour',
                count: 6,
                text: '6h'
              }, {
                type: 'day',
                count: 1,
                text: '1d'
              }, {
                type: 'all',
                count: 1,
                text: 'all'
              }, {
                type: '',
                count: 1,
                text: 'D&S',
                click: function() {
                  console.log(App.chart.series);
                  if (App.chart.options.chart.zoomType == 'x') {
                    App.chart.update({
                      chart: {
                        zoomType: undefined
                      }
                    });
                  } else {
                    App.chart.update({
                      chart: {
                        zoomType: 'x'
                      }
                    });
                  }
                }
              }, {
                type: '',
                count: 1,
                text: 'Series',
                click: function() {
                  console.log('show series');
                  App.series.names = [];
                  App.series.shifts = [];
                  for (var i = 0; i < App.names.length; ++i) {
                    App.series.names.push(App.names[i]);
                    App.series.shifts.push(App.shifts[i]);
                  }
                  App.series.visible = true;
                }
              }]
            },
            xAxis: {
              //minRange: 1000 * 60 * 60,
              events: {
                setExtremes: function(e) {
                  App.extremeType = utils.judgeExtremeType(e.min, e.max);
                },
                afterSetExtremes: function(e) {
                  console.log('afterSetExtremes')
                  labelStorage.reload(App, this, Math.round(e.min), Math.round(e.max))
                }
              }
            },
            yAxis: {
            },
            scrollbar: {
              enabled: false
            },            
            navigator: {
              adaptToUpdatedData: false
            },
            series: pre_series
          };
          App.chart = Highcharts.stockChart(container, option);

          var c = App.chart.rangeSelector.buttons, d = App.chart.options.rangeSelector.buttons;
          function bindEvents(b, c) {
            if (c.click) {
              b.on("click", c.click);
            }
          }
          if (c && d) {
            console.log(c, d);
            for (var i = 0; i < c.length; i++) {
              if (d[i]) bindEvents(c[i], d[i]);
            }
          }
          console.log('Chart init finish');
          App.$refs.globalbar.$emit('init', App.global_max, App.global_min, App.window_max, App.window_min);
        });
      },
      destroy: function() {
        this.$refs.globalbar.$emit('destroy');
        this.chart.destroy();
        labelStorage.step = null;

      },
      update: function(window_min, window_max) {
        this.chart.xAxis[1].update({
            min: window_min,
            max: window_max
        });
      }, 
      querySearch: function(name, cb) {
        var result = name ? this.allNames.filter((state) => {
          return (state.value.indexOf(name.toLowerCase()) === 0);
        }) : this.allNames;
        cb(result);
      },
      removeSeries: function(index) {
        this.series.names.splice(index, 1);
        this.series.shifts.splice(index, 1);
      },
      addSeries: function() {
        this.series.names.push('');
        this.series.shifts.push('');
      },
      confirmSeries: function() {
        this.names = this.series.names;
        this.shifts = this.series.shifts;
        this.series.visible = false;
        this.destroy();
        this.init();
      },
      cancelSeries: function() {
        this.series.visible = false;
      }
    },

    directives: {

    },

    components: {
      globalbar: GlobalBar
    }
  }

</script>

<style>

</style>
