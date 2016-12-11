<template>
  <div v-show="needBar" id="scrollbar" class="scrollbar">
    <div class="handle" style="transform: translateZ(0px) translateY(0px);">
      <div class="mousearea"></div>
  </div>
</template>

<script>
  import $ from 'jquery';
  import Sly from './sly.min.js';
  export default {
    data() {
      return {
        needBar: true
      }
    },
    created() {
      this.$on('init', this.init);
      this.$on('destroy', this.destroy);
    },
    methods: {
      destroy() {
        this.parallax.destroy();
      },

      init(global_max, global_min, window_max, window_min) {
        this.global_max = global_max;
        this.global_min = global_min;
        this.window_max = window_max;
        this.window_min = window_min;
        
        this.globalSize = this.global_max - this.global_min;
        this.windowSize = this.window_max - this.window_min;
        if (this.globalSize > this.windowSize)
          this.needBar = true
        // else
        //   this.needBar = false
        $('.handle').width(Math.round(this.windowSize * 100 / this.globalSize) + '%');

        var GlobalBar = this;

        var parallax = this.parallax = new window.Sly(this.globalSize - this.windowSize, {
          horizontal: true,
          scrollBy: Math.round((this.globalSize - this.windowSize) / 100),
          scrollSource: $('#scrollbar'),
          scrollBar: $('#scrollbar'),
          dragHandle: 1,
          clickBar: 1,
          mouseDragging: 1,
          touchDragging: 1,
          releaseSwing: 1,
          swingSpeed: 0.1,
          dragSource: $('#scrollbar'),
          speed: 600,
          startAt: 0,
          elasticBounds: 1
        });
        var render = function () {
          console.log('render');
          
          this.window_min = GlobalBar.global_min + parallax.pos.cur;
          this.window_max = GlobalBar.global_min + parallax.pos.cur + GlobalBar.windowSize;
          GlobalBar.$emit('update', this.window_min, this.window_max);
        }

        // Bind events
        parallax.on('load move', render);
        parallax.on({
          load: function () {
          },
          move: function () {
          }
        });

        // Initialize Sly instance
        parallax.init();

        GlobalBar.$emit('update', this.window_min, this.window_max);
      }
    }
  }

</script>

<style>
/* Scrollbar */
.scrollbar {
	margin: 0 0 1em 0;
	height: 3px;
	background: #ccc;
	line-height: 0;
}
.scrollbar .handle {
	width: 20%;
	height: 100%;
	background: #292a33;
	cursor: pointer;
}
.scrollbar .handle .mousearea {
	position: absolute;
	top: -9px;
	left: 0;
	width: 100%;
	height: 20px;
}
</style>