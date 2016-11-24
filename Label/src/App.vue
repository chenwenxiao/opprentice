<template>
  <div>
    <div id="container" style="width:100%; height:960px;"></div>
    <globalbar ref="globalbar"
              @update="update"/>
  </div>
</template>

<script>
  import Highcharts from 'highcharts/highstock';
  import theme from './theme.js'
  // import theme from 'highcharts/themes/dark-unica';
  import jquery from 'jquery';
  import GlobalBar from './GlobalBar.vue';

  // console.log(Highcharts.createElement);
  console.log(theme)

  theme(Highcharts);

  (function (H) {
    //获得图表rangeSelector内的所有buttons
    var A = H.Chart;
    var options = H.getOptions();
    var p = H.extend;
    var k = H.merge;
    p(A.prototype, {
      //绑定按钮事件
      bindEvents: function (b, c) {
        if (c.click) {
          b.on("click", c.click);
        }
      }
    });
    //回调函数内获取图表内rangeSelector的events配置
    A.prototype.callbacks.push(function (b) {
      //在图表加载的回调函数内逐个加载工具箱内的组件                   
      var c = b.rangeSelector.buttons, d = b.options.rangeSelector.buttons;
      if (c && d) {
        for (var i = 0; i < c.length; i++) {
          if (d[i]) b.bindEvents(c[i], d[i]);
        }
      }
    });
  })(Highcharts);

  var _minute = 1000 * 60;
  var _hour = 1000 * 60 * 60;
  var _day = 1000 * 60 * 60 * 24;
  var _week = 1000 * 60 * 60 * 24 * 7;
  var _month = 1000 * 60 * 60 * 24 * 30;
  var _year = 1000 * 60 * 60 * 24 * 365;
  
  var STORAGE_KEY = 'labels-vuejs-2.0'
  var labelStorage = {
    fetch: function (app, start=0, size=0) {
      if (size == 0) {
        return app.$http.get('/label').then(function(res){
          var json = JSON.parse(res.data);
          app.labels = json.labels;
          app.global_max = json.global_max;
          app.global_min = json.global_min;
          app.globalType = utils.judgeExtremeType(app.global_min, app.global_max);
          if (app.globalType == 'month' || app.globalType == 'year') {
            app.window_max = app.global_min + _week;
            app.window_min = app.global_min;
          } else {
            app.window_max = app.global_max;
            app.window_min = app.global_min;
          }
        }, function(res) {
          app.labels = [];
          for (var i = 0; i < 100000; ++i)
            app.labels.push([1258675200000 + i * 60000, Math.sin(i * 1.0 / 10)])
          app.global_max = app.labels[app.labels.length - 1][0];
          app.global_min = app.labels[0][0];
          app.globalType = utils.judgeExtremeType(app.global_min, app.global_max);
          if (app.globalType == 'month' || app.globalType == 'year') {
            app.window_max = app.global_min + _week;
            app.window_min = app.global_min;
          } else {
            app.window_max = app.global_max;
            app.window_min = app.global_min;
          }
        });
      } else {
        return app.$http.get('/label?start=' + start + '&size=' + size).then(function(res){
          app.labels = JSON.parse(res.data);
        }, function(res) {
          app.labels = [];
          for (var i = start; i < start + size; ++i)
            app.labels.push([1258675200000 + i * 60000, Math.sin(i * 1.0 / 10)])
        });
      }
    },

    save: function (labels) {
      //localStorage.setItem(STORAGE_KEY, JSON.stringify(labels))
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
    }

  }

  export default {
    data() {
      return {
        labels: [],
        extremeType: null,
        global_max: 0,
        global_min: 0,
        window_max: 0,
        window_min: 0
      }
    },

    mounted() {
      labelStorage.fetch(this).then(function() {
        var container = jquery('#container')[0];
        var App = this;
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
                  if (App.extremeType == 'day') {
                    var zones = [];
                    Highcharts.each(this.series[0].points, function(point) {
                      if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max) {
                    
                      }
                    });
                    zones.push({
                      value: e.xAxis[0].min - 30 * 1000,
                      color: '#2b908f'
                    });
                    zones.push({
                      value: e.xAxis[0].max + 30 * 1000,
                      color: '#f15c80'
                    });
                    zones.push({
                      color: '#2b908f'
                    });
                    this.series[0].zones = zones;
                    //this.redraw();
                    
                    this.series[0].show();
                  } else {

                  }
                }
                return false;
              }
            }
          },
          rangeSelector: {
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
            }]
          },
          xAxis: {
            //minRange: 1000 * 60 * 60,
            events: {
              setExtremes: function(e) {
                App.extremeType = utils.judgeExtremeType(e.min, e.max);
              }
            }
          },
          scrollbar: {
            enabled: false
          },
          series: [{
              name: 'Normal',
              data: App.labels, // predefined JavaScript array
              zoneAxis: 'x',
              zones: []
          }]
        };
        this.chart = Highcharts.stockChart(container, option);
        
        //TODO calc the globalmax & globalmin
        this.$refs.globalbar.$emit('init', this.global_max, this.global_min, this.window_max, this.window_min);
      });

    },

    watch: {
      '$route' (to, from) {

      },

      labels: {
        handler: function (labels) {
          labelStorage.save(labels)
        },
        deep: true
      }
    },

    computed: {

    },

    filters: {

    },

    methods: {
      update: function(window_min, window_max) {
        this.chart.xAxis[1].update({
            min: window_min,
            max: window_max
        });
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
