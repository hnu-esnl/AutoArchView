<template>
    <div>
        <a :href="url" download="svg">download</a>
        <div id="sequenceGraphEH" ref="sequenceGraph">
            <!-- <p ref="app11"></p> -->
        </div>
    </div>
</template>

<script>
// import axios from "axios";
import Vue from "vue";
import { getSvgData } from "@/libs/parseDataEH.js";
import Panzoom from "@panzoom/panzoom";
const { remote } = require("electron");
export default {
    props: ["propData"],
    data() {
        return {
            svgXML: "",
            // rightEventm: {},
            url: "",
        };
    },
    mounted() {
        setTimeout(() => {
            this.getText();
        });
    },
    beforeDestory() {
        // console.log("我销毁了吗？xxxxx时序，为啥我不销毁啊");
    },
    destroyed() {
        console.log("died");
    },
    methods: {
        //将str的dom转成真正的标签
        stringToXml(xmlString) {
            let xmlDoc = "";
            if (typeof xmlString == "string") {
                //FF
                if (document.implementation.createDocument) {
                    var parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xmlString, "text/xml");
                } else if (window.ActiveXObject) {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(xmlString);
                }
            } else {
                xmlDoc = xmlString;
            }
            return xmlDoc;
        },
        async getText() {
            let selectedNode = this.propData.selectedNode;
            let filePath = this.propData.sequencePath;
            let systemPath = this.propData.systemPath;
            let text = await getSvgData(selectedNode, filePath, systemPath);
            // console.log(text,'我是text')
            const url = process.argv;
            console.log("url", url);
            // const options = {
            //     imageFormat: "png",
            //     server: `../plantuml`,
            //     generateSource: function generateSource(umlCode) {
            //         return `../plantuml/${umlCode}`;
            //     },
            // };
            const md = require("markdown-it")() //安装Markdown-it库将markdown语法转成html
                .use(require("markdown-it-plantuml")); //使用markdown-it-plantuml的插件
            // const md = require("markdown-it")() //安装Markdown-it库将markdown语法转成html
            //     .use(require("markdown-it-plantuml"), options); //使用markdown-it-plantuml的插件
            let textDom = md.render(text) + "</img>"; //这玩意得生成一个闭合的标签不然会报错，虽然不晓得为什么
            // console.log(textDom, "ALGL");

            this.svgXML = textDom;
            let imgXml = this.stringToXml(textDom);

            // console.log(imgXml,'imgxml')
            let svgNode = imgXml.documentElement.cloneNode(true);
            var oSerializer = new XMLSerializer();
            /**生成虚拟dom */
            var sXML = oSerializer.serializeToString(svgNode);

            // console.log(sXML, "SMXL");
            var Profile = Vue.extend({
                template:
                    `<section id = "focal"><div class = "parent" id = "sequenceGraphEH" ><div id = "panzoom-element" style="height:500px;">` +
                    sXML +
                    `</div></div></section>`,
                // template: sXML,
            });
            new Profile().$mount("#sequenceGraphEH");
            const elem = document.getElementById("panzoom-element");
            this.url =
                document.querySelector("img").getAttribute("src") + ".svg";
            // this.getSvg(this.url);
            // console.log(url);
            const panzoom = Panzoom(elem, {
                maxScal: 5,
            });
            panzoom.pan(100, 100);
            panzoom.zoom(2, { animate: true });
            elem.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
        },
    },
};
</script>
<style scoped>
#container {
    height: 500px;
}
a {
    float: right;
}
</style>


