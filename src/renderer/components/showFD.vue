<template>
    <div>
        <div ref="main" id="chart" style="width: 100%; height: 500px"></div>
    </div>
</template>
<script>
let xlsx = require("node-xlsx");
const fs = require("fs");
export default {
    props: ["propData"],
    data() {
        return {
            // NodeOptions: [],
            checkAll: false,

            isIndeterminate: true,
            datas: [],
            links: [],
            nodeStyle: "react",
        };
    },

    computed: {
        selectedLinks: {
            get() {
                let s = [];
                this.checkedNodes.forEach((item) => {
                    var a = this.links.filter((element) => {
                        return (
                            item === element.source || item === element.target
                        );
                    });
                    s = s.concat(a);
                });
                // console.log(s, "woshi links");
                return s;
            },
            set(value) {
                console.log(value);
            },
        },
        selectedData: {
            get() {
                let data = this.datas.filter((item) => {
                    // console.log(item["name"], "item");

                    return this.checkedNodes.indexOf(item["name"]) != -1;
                });
                // console.log(selectedData, "");
                return data;
            },
            set(value) {
                console.log(value);
            },
        },
        checkedNodes() {
            let temp = [];
            this.propData.selectedNode.forEach((item) => {
                temp.push(item.label);
            });
            return temp;
        },
    },
    methods: {
        /**读取excel表格 获得图像数据文件**/
        onImportExcel(file) {
            console.log(file, "file");
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            // console.log(sheets);
            // 遍历 sheet
            let sheet = sheets[0].data;
            let vertex = sheet[0];
            vertex.shift();
            // 遍历xlsx每行内容
            let i = 0;
            // console.log(vertex, "我是vertex");
            this.datas = vertex.map((item) => {
                let obj = {};
                obj["name"] = item;
                obj["des"] = item + "des";
                obj["symbolSize"] = 7;
                if (i % 2 === 0) {
                    obj["category"] = 0;
                } else {
                    obj["category"] = 1;
                }
                i++;
                return obj;
            });
            vertex.unshift("0");
            // console.log(this.datas, "vertex & datas");
            for (let i = 1; i < sheet.length; i++) {
                for (let j = i + 1; j < sheet[i].length; j++) {
                    let obj = {};
                    if (sheet[i][j] > 0) {
                        obj["source"] = sheet[i][0];
                        obj["target"] = vertex[j];
                        obj["label"] = {
                            // position: "left",
                            position: "middle",
                            show: "true",
                            width: 20,
                            align: "left",
                            fontWeight: "bold",
                            fontFamily: "Arial",
                            fontSize: 14,
                            // borderColor: 'red',
                            borderWidth: 7,
                            // position: 'middle',
                            formatter(params) {
                                let reverse = " ";
                                if (sheet[j][i] > 0) {
                                    reverse = sheet[j][i];
                                }
                                return sheet[i][j] + "\n" + reverse;
                            },
                        };
                        obj["des"] = sheet[i][j] + "des";
                        this.links.push(obj);
                    }
                } //遍历矩阵构造边的数组里面的每个对象
            }
            // console.log(this.links, "我是links哈哈哈哈哈");
        },

        handleCheckedNodesChange(value) {
            let checkedCount = value.length;
            // console.log("选中了几个节点", checkedCount);
            this.checkAll = checkedCount === this.NodeOptions.length; //判断是否为全选
            this.isIndeterminate =
                checkedCount > 0 && checkedCount < this.NodeOptions.length;
            // this.checkedNodes = value;
            console.log(this.checkedNodes);
            this.drawDynamic();
        },

        drawDynamic() {
            var chart1 = this.$refs.main;
            // console.log("wo diaoyoangle ");
            var myChart = this.$echarts.init(chart1);
            // console.log(myChart, "mychart");
            var categories = [];
            for (var i = 0; i < 2; i++) {
                categories[i] = {
                    name: "类目" + i,
                };
            }
            var option = {
                // 图的标题
                title: this.title,

                // 提示框的配置
                tooltip: {
                    formatter: function (x) {
                        return x.data.des;
                    },
                },
                // 工具箱
                toolbox: {
                    // 显示工具箱
                    show: true,
                    feature: {
                        mark: {
                            show: true,
                        },
                        // 还原
                        restore: {
                            show: true,
                        },
                        // 保存为图片
                        saveAsImage: {
                            show: true,
                        },
                    },
                },
                // legend: [
                //   {
                //     // selectedMode: 'single',
                //     data: categories.map(function (a) {
                //       return a.name;
                //     }),
                //   },
                // ],
                series: [
                    {
                        symbol: this.nodeStyle,
                        type: "graph", // 类型:关系图
                        layout: "force", //图的布局，类型为力导图
                        symbolSize: 10, // 调整节点的大小
                        roam: "true", // 是否开启鼠标缩放和平移漫游。默认不开启。如果只想要开启缩放或者平移,可以设置成 'scale' 或者 'move'。设置成 true 为都开启
                        edgeSymbol: ["circle", "arrow"],
                        //边两端的标记类型，["circle", "arrow"],可以是一个数组分别指定两端，也可以是单个统一指定。默认不显示标记，常见的可以设置为箭头
                        edgeSymbolSize: [10, 10], //边两端的标记大小，可以是一个数组分别指定两端，也可以是单个统一指定
                        edgeLabel: {
                            normal: {
                                textStyle: {
                                    fontSize: 20,
                                },
                            },
                        },
                        force: {
                            repulsion: 300, ///节点之间的斥力因子。支持数组表达斥力范围，值越大斥力越大
                            edgeLength: [10, 30], //边的两个节点之间的距离，这个距离也会受 repulsion。[10, 50] ,值越小则长度越长
                            layoutAnimation: true,
                            //因为力引导布局会在多次迭代后才会稳定，这个参数决定是否显示布局的迭代动画，在浏览器端节点数据较多（>100）的时候不建议关闭，布局过程会造成浏览器假死。
                        },
                        draggable: true,
                        lineStyle: {
                            normal: {
                                width: 2,
                                color: "#4b565b",
                            },
                        },
                        edgeLabel: {
                            normal: {
                                show: true,
                                formatter: function (x) {
                                    return x.data.name;
                                },
                            },
                        },
                        label: {
                            normal: {
                                show: true,
                                textStyle: {},
                            },
                        },

                        // 数据
                        data: this.selectedData,
                        links: this.selectedLinks,
                        title: {
                            text: "ECharts 关系图",
                        },

                        categories: categories,
                    },
                ],
            };
            myChart.setOption(option);
        },
    },

    mounted() {
        // this.data.filter();
        // this.data.forEach((item) => {
        //   this.NodeOptions.push(item.name);
        // });
        console.log("mounted", this.propData.selectedNode);
        this.onImportExcel(this.propData.relationPath);

        this.drawDynamic();
    },
    beforeDestroy() {
        console.log("我翘辫子了");
    },
};
</script>
<style scoped>
</style>
