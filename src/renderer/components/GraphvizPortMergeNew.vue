<template>
    <div id="content">
        <div class="svgTxt" id="svgTxt" style="height:5000px">
            <!-- <svg width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <text font-size="14">
                    <tspan x="0" y="15">大数据交互可视化</tspan>
                    <tspan x="0" y="30">大数据量运维优化</tspan>
                </text>
            </svg>-->
            <!-- <el-button type="success" icon="el-icon-picture" circle @click="downloadSvg">导出图片</el-button> -->
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
            colorList: [
                "#F4A460",
                "#C71585",
                "#778899",
                "#CDCD00",
                "#006400",
                "#000000",
                "#008080",
                "#FF7F50",
                "#00FF00",
            ],
            svgText: ` <svg  version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <text font-size="14">`,
            // lineStyle: "line",
            graph: `digraph g {
                 splines="ortho"/*定义直角边*/
              ratio=0.618;//横纵比
        rankdir = TB;       
        node[shape = record color = lightblue fontsize = 12];
        edge[forcelabels = true dir = forward   fontsize = 12  arrowhead = vee];
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

            // console.log(svgTxt);
            // console.log(svgTxt.innerHTML, typeof svgTxt);
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
                        `<section id = "focal"><div class = "parent"><div id = "panzoom-element" style="height:2000px;">` +
                        sXML +
                        `</div></div></section>`,
                    // template: sXML,
                });
                new Profile().$mount("#svgTemplate");
                const elem = document.getElementById("panzoom-element");
                const panzoom = Panzoom(elem, {
                    maxScal: 4,
                });
                panzoom.pan(100, 100);
                panzoom.zoom(1, { animate: true });
                elem.parentElement.addEventListener(
                    "wheel",
                    panzoom.zoomWithWheel
                );
            });

            //实现右边的可拖拽
            // let graphTextXml = this.stringToXml(this.graphText);
            // console.log("graphtexML", graphTextXml);
            // /**生成真实Dom */
            // let texDom = graphTextXml.documentElement.cloneNode(true);
            // var oSerializer1 = new XMLSerializer();
            // /**生成虚拟dom */
            // var textSXML = oSerializer1.serializeToString(texDom);
            // var Profile1 = Vue.extend({
            //     template:
            //         `<section id = "focal"><div class = "parent"><div id = "panzoom-element" style="height:2000px;">` +
            //         textSXML +
            //         `</div></div></section>`,
            //     // template: sXML,
            // });
            // new Profile1().$mount("#svgTxt");
            // const elem = document.getElementById("panzoom-element");
            // const panzoom = Panzoom(elem, {
            //     maxScal: 5,
            // });
            // panzoom.pan(100, 100);
            // panzoom.zoom(2, { animate: true });
            // elem.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
        },

        onImportExcel(file) {
            let svgTxtDom = document.getElementById("svgTxt");
            let svgTxt = svgTxtDom.innerHTML + this.svgText;
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            // console.log(sheets);
            // 遍历 sheet
            let raw_sheet = sheets[0].data;
            let len = raw_sheet.length;
            let sheet = raw_sheet.slice(1, len);

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
            // console.log(this.propData.selectedNode, "我是被选中的节点");
            let selectedNode = this.propData.selectedNode;
            let selectedSwc = [];
            // let nodeSwcArray = []; //存放某一个swc的node
            // let nodePortArray = []; //存放某一个swc的某一个port的node
            let node = {};
            let flag = -1; //解决循环跳转问题
            /**解决选择乱序的问题，我来测试一下 */
            //第一步提取我需要的孙子节点
            let selectedMsg = [];
            //我需要先给我选择的节点排个序
            for (let i = 0; i < selectedNode.length; i++) {
                if (selectedNode[i].hasOwnProperty("grandfather")) {
                    selectedMsg.push(selectedNode[i]);
                }
            }
            //第二步骤 排序
            selectedMsg.sort(function (a, b) {
                return a["id"] - b["id"];
            });
            // console.log(selectedMsg, "我是排序之后的selectedMsg");

            /**取到所有节点到selectedSwc里面表示被选择的swc数组*/
            for (let i = 0; i < selectedNode.length; i++) {
                //遍历选择的节点的爷爷,因为爷爷代表了组件swc只有send和receive都是我要的swc才是可以的
                if (
                    selectedNode[i].hasOwnProperty("grandfather") &&
                    selectedSwc.indexOf(selectedNode[i]["grandfather"]) === -1
                ) {
                    selectedSwc.push(selectedNode[i]["grandfather"]);
                } else if (
                    selectedNode[i].hasOwnProperty("flagRswc") &&
                    selectedSwc.indexOf(selectedNode[i]["label"]) === -1
                ) {
                    selectedSwc.push(selectedNode[i]["label"]);
                }
            }
            selectedSwc.forEach((swc) => {
                str += `${swc}[label = "{${swc}| | }"]\n`;
            });
            // console.log(selectedSwc, "接收的swc");
            let colorIndex = 0;
            let numEdge = 1;
            let msgHeight = 1; //记录左边消息的行高y;
            let msgList = [];
            for (let i = 0; i < selectedMsg.length; i++) {
                // console.log(node, i, "第几条的node");
                for (let j = 0; j < sheet.length; j++) {
                    // flag = -1;
                    if (
                        selectedMsg[i]["grandfather"] === sheet[j][0] && //sendswc
                        selectedMsg[i]["father"] === sheet[j][2] && //pPort
                        selectedMsg[i]["label"] === sheet[j][3] && //msg
                        selectedSwc.indexOf(sheet[j][1]) >= 0 //我的receiveSWC也在选择的节点里面
                    ) {
                        let sendName = sheet[j][0];
                        let receiveName = sheet[j][1];
                        let pPort = sheet[j][2];
                        let msg = sheet[j][3];

                        if (JSON.stringify(node) === "{}") {
                            //第一次匹配上
                            node = {
                                sendName,
                                receiveName,
                                pPort,
                                msg,
                                num: numEdge, //边的数量
                            };
                            msgList.push(msg);
                            str += `${node["sendName"]}->${node["receiveName"]} [tooltip="${node["pPort"]}" xlabel = "${node["num"]}" color ="${this.colorList[colorIndex]}" fontcolor = "${this.colorList[colorIndex]}" ]; \n`;
                            svgTxt += `<tspan x="0" y=${
                                msgHeight++ * 15
                            }  fill = ${this.colorList[colorIndex]}>\n${
                                node["num"]
                            }. ${node["pPort"]}：</tspan>
                                       `;
                        } else if (
                            node["sendName"] != sendName ||
                            node["receiveName"] != receiveName ||
                            node["pPort"] != pPort
                        ) {
                            //发送接受组件或者pPort和上一个不同，说明有一条线要新增了
                            //先把上一条线的msg给填了
                            if (msgList.length > 0) {
                                msgList.forEach((message) => {
                                    svgTxt += ` <tspan x="0" y=${
                                        msgHeight++ * 15
                                    }  fill = ${
                                        this.colorList[colorIndex]
                                    }>${message}</tspan>`;
                                });
                            }

                            //新增一条边
                            numEdge++;
                            colorIndex =
                                (colorIndex + 1) % this.colorList.length; //颜色改变了加一
                            str += `${sendName}->${receiveName} [tooltip="${pPort}" xlabel = "${numEdge}" color ="${this.colorList[colorIndex]}" fontcolor = "${this.colorList[colorIndex]}" ]; \n`;
                            svgTxt += `<tspan x="0" y=${
                                msgHeight++ * 15
                            }  fill = ${
                                this.colorList[colorIndex]
                            }>${numEdge}. ${pPort}：</tspan>
                            <tspan x="0" y=${msgHeight++ * 15}  fill = ${
                                this.colorList[colorIndex]
                            }>${msg}</tspan>`;

                            msgList = []; //重新把msgList置为空

                            node = {
                                sendName,
                                receiveName,
                                pPort,
                                msg,
                                num: numEdge,
                            };
                        } else {
                            // msg不同str没有增加，边的数目也没有增加但是svgTxt要加;
                            node = {
                                sendName,
                                receiveName,
                                pPort,
                                msg,
                                num: numEdge,
                            };
                            msgList.push(msg);
                        }
                    }
                }
            }
            if (msgList.length > 0) {
                msgList.forEach((message) => {
                    svgTxt += ` <tspan x="0" y=${msgHeight++ * 15}  fill = ${
                        this.colorList[colorIndex]
                    }>${message}</tspan>`;
                });
            }
            svgTxt += `</text></svg>`;
            svgTxtDom.innerHTML = svgTxt;
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
        this.contentHeight = this.propData.height;
        this.nodes = this.propData.selectedNode;
        // console.log(this.nodes, "wo是nodes");

        this.paintStr = this.onImportExcel(this.propData.messagePath);
        console.log(this.paintStr, typeof paintStr, "我是paintoStr");
        // this.graphText = this.onImportExcel(this.propData.messagePath)[
        //     "svgTxt"
        // ];
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

.svgTxt {
    float: right;
    white-space: pre-line;
    /* height: 900px; */
}
</style>
