<template>
    <div id="content">
        <div class="btn">
            <el-button type="success" icon="el-icon-picture" circle @click="downloadSvg">导出图片</el-button>
        </div>
        <div id="svgTemplate" class="svgGraph"></div>
    </div>
</template>
<script>
import Vue from "vue";
let xlsx = require("node-xlsx");
const fs = require("fs");
import Panzoom from "@panzoom/panzoom";

export default {
    props: ["propData"],
    data() {
        return {
            nodes: [],
            svgXml: "",
            svgDom: "",
            // lineStyle: "line",
            //         graph: `digraph g {
            //           ratio=0.8;//横纵比
            //     rankdir = TB;
            //     node[shape = box color = lightblue fontsize = 12];
            //     edge[dir = both arrowtail = odot  fontsize = 12 ];
            //    \n`, //tail是箭头的尾巴
            graph: `digraph g {
                 splines="ortho"/*定义直角边*/
              ratio=0.618;//横纵比
        rankdir = TB;       
        node[shape = record color = lightblue fontsize = 12 width = 2 height=0.8 fixedsize = true];
        // edge[forcelabels = true dir = forward   fontsize = 12  arrowhead = vee];
        edge[ dir = forward   fontsize = 12  arrowhead = vee];
       \n`, //tail是箭头的尾巴
            contentHeight: 0,
            paintStr: "",
        };
    },
    methods: {
        //将svg string转成html认识的标签
        stringToXml(xmlString) {
            var xmlDoc;
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
        drawSvg() {
            const { graphviz } = require("node-graphviz");
            console.log(this.graph, "wandanle");
            graphviz.dot(this.graph, "svg").then((svg) => {
                // let patt = /<svg[\s\S]*<\/svg>/g;
                // console.log(svg);
                this.svgXml = svg;
                let svgXml = this.stringToXml(svg);
                /**生成真实Dom */
                this.svgDom = svgXml.documentElement.cloneNode(true);
                var oSerializer = new XMLSerializer();
                /**生成虚拟dom */
                var sXML = oSerializer.serializeToString(this.svgDom);
                var Profile = Vue.extend({
                    template:
                        `<section id = "focal"><div class = "parent"><div id = "panzoom-element" style="height:500px;">` +
                        sXML +
                        `</div></div></section>`,
                    // template: sXML,
                });
                new Profile().$mount("#svgTemplate");
                const elem = document.getElementById("panzoom-element");
                const panzoom = Panzoom(elem, {
                    maxScal: 5,
                });
                panzoom.pan(100, 100);
                panzoom.zoom(2, { animate: true });
                elem.parentElement.addEventListener(
                    "wheel",
                    panzoom.zoomWithWheel
                );
            });
        },
        onImportExcel(file) {
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            console.log(sheets);
            // 遍历 sheet
            let raw_sheet = sheets[0].data;
            let len = raw_sheet.length;
            let sheet = raw_sheet.slice(1, len);
            /*排序*/
            sheet.sort(function (a, b) {
                if (a[0] === b[0]) {
                    if (a[1] === b[1]) {
                        return a[2].localeCompare(b[2]);
                    }
                    return a[1].localeCompare(b[1]);
                }
                return a[0].localeCompare(b[0]);
            });
            let str = "";
            let selectedNode = this.propData.selectedNode;
            let selectedPort = [];
            let selectedRunnable = [];
            let selectedObj = {};
            let nodeArray = [];
            /**取到所有节点放到selectedRunnable里面 */
            for (let i = 0; i < selectedNode.length; i++) {
                console.log(selectedNode[i]);
                if (selectedNode[i].hasOwnProperty("runnable")) {
                    //记录选择的RUNNABLE节点
                    selectedRunnable.push(selectedNode[i]["label"]);
                    if (JSON.stringify(selectedObj) != "{}") {
                        selectedPort.push(selectedObj);
                    }
                    selectedObj = {};
                    selectedObj["runnableName"] = selectedNode[i]["label"];
                    selectedObj["port"] = [];
                } else {
                    selectedObj["port"].push(selectedNode[i]["label"]);
                }
            }
             selectedPort.push(selectedObj);
            // console.log(selectedPort,'SPORT')
            /**根据选择的runnable匹配**/
            let count = 0 ;
            for (let i = 0; i < sheet.length; i++) {
                let nodeObj = {};
                if (selectedRunnable.indexOf(sheet[i][0]) >= 0) {
                    count++;
                    selectedPort.forEach((runnable) => {
                        if (
                            runnable["runnableName"] === sheet[i][0] &&
                            runnable["port"].indexOf(sheet[i][2]) >= 0 ) {   
                            if(selectedRunnable.indexOf(sheet[i][1]) >= 0){
                            nodeObj["sendRun"] = sheet[i][0];
                            nodeObj["recRun"] = sheet[i][1];
                            nodeObj["portVal"] = sheet[i][2];
                            nodeArray.push(nodeObj);
                            }
                        }
                    });
                }
            }
        
            nodeArray.forEach((nodeObj) => {
                str += `${nodeObj["sendRun"]}->${nodeObj["recRun"]} [tooltip = "${nodeObj["portVal"]}" labelfontcolor="red" color = "skyblue" fontcolor = "purple"];\n`;
            });
            // console.log(str, typeof str, "我是str");
            if (str === "") {
                this.$alert("所选的组件之间没有交互，请重新选择", "warning", {
                    confirmButtonText: "确定",
                    callback: (action) => {},
                });
            }
            return str;
        },
        downloadSvg() {
            const { remote } = require("electron");
            let filePath = remote.dialog.showSaveDialog({
                title: "请选择要保存的文件名",
                buttonLabel: "保存",
                filters: [
                    {
                        name: "Custom File Type",
                        extensions: ["svg"],
                    },
                ],
            });
            fs.writeFile(filePath, this.svgXml, (err) => {
                if (!err) {
                    this.$alert("下载成功", "导出图片", {
                        confirmButtonText: "确定",
                        callback: (action) => {
                            this.$message({
                                type: "info",
                                message: `action: ${action}`,
                            });
                        },
                    });
                } else {
                    this.$alert(err, "导出图片", {
                        confirmButtonText: "确定",
                        callback: (action) => {
                            this.$message({
                                type: "info",
                                message: `action: ${action}`,
                            });
                        },
                    });
                }
            });
        },
    },
    mounted() {
        //指定绘图方向为从左到右"TB", "LR", "BT", "RL"
        //指定为双向箭头both 箭头尾部为Odot原点
        //设置线条的类型为折线
        // console.log(this.propData.height, "gaogdu");
        console.log("?");
        this.contentHeight = this.propData.height;
        this.nodes = this.propData.selectedNode;
        console.log(this.nodes, "wo是nodes");
        this.paintStr = this.onImportExcel(this.propData.runnablePath);
        console.log(this.paintStr, "我是paintoStr");
        this.graph += this.paintStr + `};`;
        this.drawSvg();
    },
    beforeDestroy() {
        console.log("我销毁了吗？");
    },
};
</script>
<style scoped>
#content {
}

.btn {
    float: right;
}
</style>
