<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>{{ msg }}</h1>
    <Card ></Card>
    <el-button class="button" type="primary" @click.native="startHacking">Let's do it</el-button>
  </div>
</template>

<script>
import Card from './Card.vue'
export default {
  data () {
    return {
      msg: 'Opprentice Report'
    }
  },

  methods: {
    startHacking () {
      this.$notify({
        title: 'It Works',
        message: 'We have laid the groundwork for you. Now it\'s your time to build something epic!',
        duration: 6000
      })
    }
  },

  components: {
    Card
  }
}
</script>

<style>
body {
  font-family: Helvetica, sans-serif;
}
</style>
