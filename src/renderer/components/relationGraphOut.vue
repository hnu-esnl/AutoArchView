<template>
    <div>
        <el-select v-model="value" filterable placeholder="请选择需要展示的swc">
            <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.label"
            ></el-option>
        </el-select>

        <div style="height: calc(100vh - 50px)">
            <RelationGraphOut
                ref="seeksRelationGraph"
                :options="graphOptions"
                :on-node-click="onNodeClick"
                :on-line-click="onLineClick"
            />
        </div>
    </div>
</template>
 
 <script>
let xlsx = require("node-xlsx");
const fs = require("fs");
import RelationGraphOut from "relation-graph";
export default {
    name: "Demo",
    components: { RelationGraphOut },
    props: ["propData"],
    data() {
        return {
            value: "",
            options: [],
            graphOptions: {
                allowSwitchLineShape: true,
                allowSwitchJunctionPoint: true,
                defaultJunctionPoint: "border",
                //  <!-- 这里可以参考"Graph 图谱"中的参数进行设置 -->
            },
            nodeSet: [],
            linkSet: [],
            linkArray: [],
            colorSet: [
                "yellow",
                "blue",
                "green",
                "orange",
                "pink",
                "gray",
                "brown",
            ],
            vertex: [],
        };
    },
    mounted() {
        //console.log(this.$router)
        let filePath = this.propData.relationPath.replace(/\\/g, "\\\\");
        this.onImportExcel(filePath);
        this.vertex.forEach((item, index) => {
            let nodeObj = {};
            let optionObj = {};

            optionObj.label = item;
            optionObj.value = `选项${index + 1}`;

            nodeObj.id = index.toString();
            nodeObj.text = item;
            nodeObj.color = this.colorSet[index % 7];
            nodeObj.fontColor = "black";
            this.nodeSet.push(nodeObj);
            this.options.push(optionObj);
        });

        this.linkArray.forEach((item, from) => {
            item.forEach((text, to) => {
                let linkObj = {};
                linkObj.from = from.toString();
                linkObj.to = to.toString();
                linkObj.text = text.toString();
                linkObj.color = "grey";
                this.linkSet.push(linkObj);
            });
        });
    },
    watch: {
        value(newVal) {
            this.showSeeksGraph(newVal);
        },
    },
    methods: {
        onImportExcel(file) {
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            // console.log(sheets);
            // 遍历 sheet
            let sheet = sheets[0].data;
            this.vertex = sheet[0];
            this.vertex.shift();
            // 遍历xlsx每行内容
            let temp = [];
            for (let i = 1; i < sheet.length; i++) {
                sheet[i].shift();
                temp.push(sheet[i]);
            }
            this.linkArray = temp;
        },
        showSeeksGraph(newVal) {
            let nodes = new Array();
            nodes.length = 0;
            let links = new Array();
            links.length = 0;
            console.log(newVal, nodes);
            let swcName = this.nodeSet.filter((t) => {
                return t.text === newVal;
            });
            //console.log("我是swcname", swcName[0]);
            //      this.nodeIndex = this.linkArray[swcName.id];
            let nodeIndex = [];
            console.log(swcName);
            nodeIndex.push(swcName[0].id);
            let id = Number(swcName[0].id);

            this.linkArray[id].forEach((t, index) => {
                if (t > 0) {
                    nodeIndex.push(index.toString());
                }
            });
            // console.log("我是node索引", nodeIndex);
            // console.log("wo shi kongde", nodes);
            // console.log("我是nodeSet", this.nodeSet);

            for (var j = 0; j < nodeIndex.length; j++) {
                for (var i = 0; i < this.nodeSet.length; i++) {
                    if (nodeIndex[j] === this.nodeSet[i].id) {
                        //console.log(nodeIndex[j], "&&", this.nodeSet[i].id);
                        nodes.push(this.nodeSet[i]);
                        break;
                    }
                }
            }

            links = this.linkSet.filter((t) => {
                return t.from === swcName[0].id && t.text != "0";
            });
            //console.log("我是links111", this.links);
            var __graph_json_data = {
                rootId: swcName[0].id,
                nodes: nodes,
                links: links,
            };
            console.log("111", __graph_json_data);
            this.$refs.seeksRelationGraph.setJsonData(
                __graph_json_data,
                (seeksRGGraph) => {
                    // Called when the relation-graph is completed
                    console.log(this.$refs.seeksRelationGraph.setJsonData);
                }
            );
        },

        onNodeClick(nodeObject, $event) {
            console.log("onNodeClick:", nodeObject);
        },
        onLineClick(lineObject, $event) {
            console.log("onLineClick:", lineObject);
        },
    },
};
</script>