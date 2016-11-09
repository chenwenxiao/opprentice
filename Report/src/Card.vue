<template>
  <el-row>
    <el-col :span="11" v-for="(o, index) in cards" :offset="index % 2 === 0 ? 0 : 1">
      <el-card :body-style="{ padding: '0px' }">
        <el-row>
          <el-col :span="16">
            <img src="./assets/logo.png" class="image">
          </el-col>
          <el-col :span="8">
            <div style="padding: 14px;">
              <h2>{{o.name}}</h2>
              <div class="bottom clearfix">
                <el-button type="primary" class="button" @click.native="gotoTask(o.id)">查看任务</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      cards: [
        {id : 0, name : "Task0"},
        {id : 1, name : "Task1"},
        {id : 2, name : "Task2"},
        {id : 3, name : "Task3"}]
    }

  },

  methods: {
    gotoTask(index) {
      // router.push('/task/index')
    }

  }
}
</script>

<style>
</style>