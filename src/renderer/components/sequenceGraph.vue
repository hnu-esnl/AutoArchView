<template>
    <div id="container" ref="sequenceGraph">
        <!-- <p ref="app11"></p> -->
    </div>
</template>

<script>
import { getSvgData } from "@/libs/parseData.js";
import Panzoom from "@panzoom/panzoom";
export default {
    props: ["propData"],
    data() {
        return {};
    },
    mounted() {
        // console.log("我是时序图");
        // console.log(this.propData);
        //打包没办法获取到dom元素，所以想试试包一个nextTick
        // this.$nextTick(() => {
        setTimeout(() => {
            this.getText();
        });
        //   }, 20);
    },
    beforeDestory() {
        // console.log("我销毁了吗？");
    },
    methods: {
        async getText() {
            let selectedNode = this.propData.selectedNode;
            let filePath = this.propData.sequencePath;
            let systemPath = this.propData.systemPath;

            let text = await getSvgData(selectedNode, filePath, systemPath);

            // console.log("我是text", text);
            let d = Diagram.parse(text);
            //   this.$refs.xxx.documentElement.cloneNode(true);

            let container = this.$refs.sequenceGraph;
            // console.log(document.getElementById("container"), "container版本");

            /**坑爹的传值问题，container如果传递字符串就会出问题，*/
            d.drawSVG(container, {
                theme: "simple",
            });

            // const elem = document.getElementById("sequenceGraph");
            const elem = this.$refs.sequenceGraph;
            const panzoom = Panzoom(elem, {
                maxScal: 3,
            });
            panzoom.pan(10, 10);
            panzoom.zoom(1, { animate: true });
            elem.addEventListener("wheel", panzoom.zoomWithWheel);
        },
    },
};
</script>
<style scoped>
#container {
    height: 500px;
}
</style>
