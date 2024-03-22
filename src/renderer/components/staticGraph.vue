
<template>
  <div class="container">
    <div id="left" class="layout">
      <div
        id="Applet1"
        style="border: 1px black solid; margin: 2px; padding: 2px; height: 97%"
      >
        <el-tag type="success">静态图入度</el-tag>
        <relationGraphIn :propData="propData"></relationGraphIn>
      </div>
    </div>

    <div id="right" class="layout">
      <div
        id="Applet3"
        style="border: 1px black solid; margin: 2px; padding: 2px; height: 97%"
      >
        <el-tag type="success">静态图出度</el-tag>
        <relationGraphOut :propData="propData"></relationGraphOut>
      </div>
    </div>
  </div>
</template>

<script >
import relationGraphIn from "./relationGraphIn.vue";
import relationGraphOut from "./relationGraphOut.vue";
export default {
  components: {
    relationGraphIn,
    relationGraphOut,
  },
  props: ["propData"],
  methods: {},
};
// })
</script>
<style scoped>
.container {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Arial;
}

.layout {
  float: left;
  height: 100%;
  width: 50%;
  /* background: #888; */
}
el-tag {
  float: left;
}
</style>
 

 


 
 



