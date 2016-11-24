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
                <el-button type="primary" class="button" @click.native="gotoTask(o.id)">查看报告</el-button>
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
    console.log('data() is ready');
    return {
      cards: []
       // {id:0, name:"/shiro/GitProject/train/cnn/lab2/report", path:"/home/shiro/GitProject/train/cnn/lab2/report", symbolic:false},
       // {id:1, name:"/shiro/GitProject/train/cnn/lab1/report", path:"/home/shiro/GitProject/train/cnn/lab1/report", symbolic:false},
       // {id:2, name:"/GitProject/train/cnn/latest/report", path:"/home/shiro/GitProject/train/cnn/latest/report", symbolic:false}]
    }

  },

  mounted() {
    console.log('mounted() is ready');
    this.getDatas();
  },

  methods: {
    getDatas() {
      this.$http.get("/lab").then(function(response){
        this.cards = JSON.parse(response.data)
        console.log(cards);
      });
    },

    gotoTask(index) {
      // router.push('/task/index')
    }

  }
}
</script>

<style>
</style>