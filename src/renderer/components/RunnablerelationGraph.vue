<template>
    <div>
        <el-select v-model="value" filterable placeholder="请选择需要展示的swc"
        style="weight:700px">
            <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.label"
            ></el-option>
        </el-select>

        <div style="height: calc(100vh - 50px)">
            <RunnableRelationGraph
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
import RunnableRelationGraph from "relation-graph";
export default {
    name: "Demo",
    components: { RunnableRelationGraph },
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
        // console.log(this.propData.relation, "ppp");
        let filePath = this.propData.relationPath.replace(/\\/g, "\\\\");
        console.log("mounted", filePath);
        this.onImportExcel(filePath);

        // console.log(this.linkArray,"我是linkArray");
           this.vertex.forEach((item, index) => {
            let nodeObj = {};
            let optionObj = {};
            optionObj.label = item;
            optionObj.value = `选项${index + 1}`;

            nodeObj.id = index.toString();
            nodeObj.text = item;
            nodeObj.color = this.colorSet[index % 7];
            nodeObj.fontColor = "black";
            //储存全部节点对象的数组
            this.nodeSet.push(nodeObj);
            this.options.push(optionObj);
        });
        
      
        this.linkArray.forEach((row, fromIndex) => {
            row.forEach((value, toIndex) => {
                let linkObj = {};
                linkObj.from = fromIndex.toString();
                linkObj.to = toIndex.toString();
                linkObj.text =value.toString();
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
            /**取得第一行的节点 */
            this.vertex = sheet[0];
            this.vertex.shift();//vertex存储节点信息
            // 遍历xlsx每行内容
            let temp = [];
            for (let i = 1; i < sheet.length; i++) {
                //每一行去掉第一列
                sheet[i].shift();
                temp.push(sheet[i]);
            }
            this.linkArray = temp;
        },
        showSeeksGraph(newVal) {
            let nodes = [];
            let links = [];
            let swcName;
            for(let i = 0;i<this.nodeSet.length;i++){
                if(this.nodeSet[i].text === newVal){
                    swcName = this.nodeSet[i];
                    break;
                }
            }           
            let nodeIndex = [];
            console.log(swcName,'swcName');

            /**先把主节点的index给push进去*/
            nodeIndex.push(swcName.id);
            let id = Number(swcName.id);
            console.log(id,"id");
   
            /**把非主节点的index给push进去*/
            this.linkArray[id].forEach((t, index) => {
                
                if (t > 0) {
                    nodeIndex.push(index.toString());
                    console.log(t,"t",index,"index");
                }
            });
            for(let i = 0;i<this.linkArray.length;i++){
                if(i === id){
                    continue;
                }
                let value = this.linkArray[i][id];
                if(value>0){
                    console.log("jagljagl",i);
                    nodeIndex.push(i.toString());
                }
            }
            console.log(nodeIndex,'nodeIndex');
            /**对于全部的node节点 */
             
                for (let  i = 0; i < this.nodeSet.length; i++) {
                    if(nodeIndex.indexOf(this.nodeSet[i].id)>=0)
                   {
                        nodes.push(this.nodeSet[i]);
                   }           
            }
            this.linkSet.forEach(link=>{
                if(link.from===swcName.id&&nodeIndex.indexOf(link.to)>=0){
                    if(link.text != "0"){
                        console.log("from");
                        links.push(link);
                    }
                }
                else if(link.to===swcName.id&&nodeIndex.indexOf(link.from)>=0)
                {
                     if(link.text != "0"){
                        links.push(link);
                        console.log("to");
                    }
                }
            })
            // links = this.linkSet.filter((t) => {
            //     return (t.to === swcName.id && t.text != "0"&& nodeIndex.indexOf(t.from)>=0)|| (t.from === swcName.id && t.text != "0"&&nodeIndex.indexOf(t.to)>=0);
            // });
            console.log("我是links111",links);
            console.log("我是nodes",nodes)
            var __graph_json_data = {
                rootId: swcName.id,
                nodes: nodes,
                links: links,
            };

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