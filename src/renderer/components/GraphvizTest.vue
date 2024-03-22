<template>
    <div id="classDiagram" class="classDiagram"></div>
</template>
<script>
import Vue from "vue";
let xlsx = require("node-xlsx");
const fs = require("fs");
// import Panzoom from "@panzoom/panzoom";

export default {
    props: ["propData"],

    data() {
        return {
            nodes: [],
            svgXml: "",
            svgDom: "",
            screenW: document.documentElement.clientWidth, //屏幕的宽度
            screenH: document.documentElement.clientHeight, //屏幕的高度
            nodeClass: [],
            classDiagram: {},
            columnwidth: 0,
            rowHeight: 0,
            nodeClassWidth: 0,
            nodeClassHeight: 0,
            // lineStyle: "line"
        };
    },
    methods: {
        onImportExcel(file) {
            let relation = [[]];
            // let relationNum = [];
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            // 遍历 sheet
            let raw_sheet = sheets[0].data;
            let len = raw_sheet.length;
            let sheet = raw_sheet.slice(1, len);

            //给sheet按照第一行sendSWC 第二行receiveSwc 第三行Pport来排序
            sheet.sort(function (a, b) {
                if (a[0] === b[0]) {
                    if (a[1] === b[1]) {
                        return a[2].localeCompare(b[2]);
                    }
                    return a[1].localeCompare(b[1]);
                }
                return a[0].localeCompare(b[0]);
            });

            let selectedNode = this.propData.selectedNode;
            let selectedSwc = [];
            let selectedMsg = [];
            //我需要先给我选择的节点排个序

            //第一步提取我需要的孙子节点，孙子节点都是含有msg的
            for (let i = 0; i < selectedNode.length; i++) {
                if (selectedNode[i].hasOwnProperty("grandfather")) {
                    selectedMsg.push(selectedNode[i]);
                }
            }
            //第二步骤 排序
            selectedMsg.sort(function (a, b) {
                return a["id"] - b["id"];
            });

            /**提取到选择的 接收swc */
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
                    // console.log("我有接受节点");
                    selectedSwc.push(selectedNode[i]["label"]);
                }
            }
            // console.log(selectedSwc, "接收的swc");

            let k = 0; //记录当前是第几个发送组件
            for (let i = 0; i < selectedMsg.length; i++) {
                for (let j = 0; j < sheet.length; j++) {
                    if (
                        selectedMsg[i]["grandfather"] === sheet[j][0] &&
                        selectedMsg[i]["father"] === sheet[j][2] &&
                        selectedMsg[i]["label"] === sheet[j][3] &&
                        selectedSwc.indexOf(sheet[j][1]) >= 0 //我的receiveSWC也在选择的节点里面
                    ) {
                        //sendSWC不同新建一个sendSWC
                        if (relation[0].length === 0) {
                            relation[0] = [
                                {
                                    sendSwc: sheet[j][0],
                                    receiveSwc: sheet[j][1],
                                    // pPort: sheet[j][2],
                                    msg: [sheet[j][2] + ":" + sheet[j][3]],
                                },
                            ];

                            // k++;
                        } else {
                            //和前面一个的sendSwc不同
                            if (
                                relation[k][relation[k].length - 1][
                                    "sendSwc"
                                ] != sheet[j][0]
                            ) {
                                //新建一个sendSWC
                                k++;
                                relation[k] = [
                                    {
                                        sendSwc: sheet[j][0],
                                        receiveSwc: sheet[j][1],
                                        // pPort: sheet[j][2],
                                        msg: [sheet[j][2] + ":" + sheet[j][3]],
                                    },
                                ];
                            }
                            //说明还是在这个发送的SWC里面那么就不需要k++
                            //如果接收方变了
                            if (
                                relation[k][relation[k].length - 1][
                                    "receiveSwc"
                                ] != sheet[j][1]
                            ) {
                                //当前发送节点push新的对象
                                relation[k].push({
                                    sendSwc: sheet[j][0],
                                    receiveSwc: sheet[j][1],
                                    // pPort: sheet[j][2],
                                    msg: [sheet[j][2] + ":" + sheet[j][3]],
                                });
                            } else {
                                //那肯定是msg变了,当前发送节点的最后一个对象的msg里面push新的msg
                                relation[k][relation[k].length - 1]["msg"].push(
                                    sheet[j][2] + ":" + sheet[j][3]
                                );
                            }
                        }
                    }
                }
            }
            if (relation[0].length === 0) {
                this.$alert("所选的组件之间没有交互，请重新选择", "warning", {
                    confirmButtonText: "确定",
                    callback: (action) => {},
                });
                return { selectedSwc: [], relation };
            }
            return { selectedSwc, relation };
        },
        drawNode(selectedSwc) {
            let nodePosition = {
                x: 0,
                y: 0,
            };
            let nodeNum = selectedSwc.length;
            this.columnwidth = this.screenW / 3;
            this.rowHeight = this.screenH / 3;
            this.classDiagram = new UMLClassDiagram({
                id: "classDiagram",
                width: this.screenW - 20,
                height: this.screenH - 20,
            });
            //创建节点
            if (nodeNum > 5) {
                alert("请选择小于5个的组件");
            } else {
                for (let i = 0; i < nodeNum; i++) {
                    switch (i) {
                        case 0:
                            nodePosition = {
                                x: 1.3 * this.columnwidth,
                                y: 1.3 * this.rowHeight,
                            };
                            break;
                        case 1:
                            nodePosition = {
                                x: 1.3 * this.columnwidth,
                                y: 0.3 * this.rowHeight,
                            };
                            break;
                        case 2:
                            nodePosition = {
                                x: 2.3 * this.columnwidth,
                                y: 1.3 * this.rowHeight,
                            };
                            break;
                        case 3:
                            nodePosition = {
                                x: 0.3 * this.columnwidth,
                                y: 1.3 * this.rowHeight,
                            };
                            break;
                        case 4:
                            nodePosition = {
                                x: 1.3 * this.columnwidth,
                                y: 2.3 * this.rowHeight,
                            };
                            break;
                        default:
                            break;
                    }
                    // if (i < nodeNum) {
                    this.nodeClass[i] = new UMLClass(nodePosition);
                    this.nodeClass[i].setHeight(50);
                    this.nodeClass[i].setWidth(100);
                    this.nodeClassHeight = 50;
                    this.nodeClassWidth = 100;
                    this.nodeClass[i].setName(selectedSwc[i]);
                    this.classDiagram.addElement(this.nodeClass[i]);
                    // this.nodeClass[i].setHeight(50);
                    // this.nodeClass[i].setWidth(80);
                    // }
                }
            }
        },
        drawRelation(selectedSwc, relation) {
            let canvasDiagram = document.getElementsByTagName("canvas")[1];
            let ctx = canvasDiagram.getContext("2d");
            for (let indexi = 0; indexi < relation.length; indexi++) {
                let sendSwc = relation[indexi][0]["sendSwc"];
                // console.log(relation, "p");
                let i = selectedSwc.indexOf(sendSwc); //找到入节点的index值
                let centerPoint = this.nodeClass[i].getCentralPoint();
                let xi = this.nodeClass[i].getX(); //入节点的左上
                let yi = this.nodeClass[i].getY();
                for (
                    let indexj = 0;
                    indexj < relation[indexi].length;
                    indexj++
                ) {
                    let receiveSwc = relation[indexi][indexj]["receiveSwc"];
                    let str = relation[indexi][indexj]["msg"].join("\n");
                    console.log(str, "msg");
                    let j = selectedSwc.indexOf(receiveSwc);
                    let xj = this.nodeClass[j].getX();
                    let yj = this.nodeClass[j].getY(); //出节点的左上

                    if (i === 0 || j === 0) {
                        // this.classDiagram.addElement(
                        //     new UMLDependency({
                        //         a: this.nodeClass[i],
                        //         b: this.nodeClass[j],
                        //     })
                        // );
                        // ctx.font = "30px Arial";
                        // ctx.fillText(
                        //     str,
                        //     centerPoint._x + this.nodeClassWidth / 2 + 1,
                        //     centerPoint._y
                        // );
                    } else if (i === 1) {
                        if (j === 3 || j === 2) {
                            if (j === 2) {
                                let refNodeEnter = new Node({
                                    x: xi + this.nodeClassWidth - 5,
                                    y: yi + this.nodeClassHeight / 3 - 5, //入节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xj + (this.nodeClassWidth / 3) * 2 - 5,
                                    y: yi + this.nodeClassHeight / 3 - 5, //参考节点2
                                });
                                let refNodeExit = new Node({
                                    x: xj + (this.nodeClassWidth / 3) * 2 - 5, //入节点的参考节点一
                                    y: yj, //出节点的参考节点一
                                });
                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            } else {
                                //1->3
                                let refNodeEnter = new Node({
                                    x: xi,
                                    y: yi + this.nodeClassHeight / 3 - 5, //入节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xj + this.nodeClassWidth / 3 - 5,
                                    y: yi + this.nodeClassHeight / 3 - 5, //参考节点2
                                });
                                let refNodeExit = new Node({
                                    x: xj + this.nodeClassWidth / 3 - 5, //入节点的参考节点一
                                    y: yj, //出节点的参考节点一
                                });
                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            }
                        } else {
                            //1->4
                            // let xjc = this.nodeClass[j].getCentralPoint()._x; //出节点的中心
                            // let yjc = this.nodeClass[j].getCentralPoint()._y;
                            let refNodeEnter = new Node({
                                x: xi,
                                y: yi + (this.nodeClassHeight / 3) * 2 - 5, //入节点的参考节点一
                            });
                            let refNodeMid1 = new Node({
                                x: xi - this.columnwidth / 2 - 5,
                                y: yi + (this.nodeClassHeight / 3) * 2 - 5, //中间参考节点1
                            });
                            let refNodeMid2 = new Node({
                                x: xi - this.columnwidth / 2 - 5,
                                y: yj + this.nodeClassHeight / 3 - 5, //中间参考节点2
                            });
                            let refNodeExit = new Node({
                                x: xj,
                                y: yj + this.nodeClassHeight / 3 - 5, //出节点的参考节点一
                            });
                            let relationEnterToMid1 = new UMLDependency({
                                a: refNodeEnter,
                                b: refNodeMid1,
                            });
                            let relationMid1ToMid2 = new UMLDependency({
                                a: refNodeMid1,
                                b: refNodeMid2,
                            });
                            let relationMid2ToExit = new UMLDependency({
                                a: refNodeMid2,
                                b: refNodeExit,
                            });
                            relationEnterToMid1.setDirection("none");
                            relationMid1ToMid2.setDirection("none");
                            this.classDiagram.addElement(relationEnterToMid1);
                            this.classDiagram.addElement(relationMid1ToMid2);
                            this.classDiagram.addElement(relationMid2ToExit);
                        }
                    } else if (i === 3) {
                        // let xj = this.nodeClass[j].getX();
                        // let yj = this.nodeClass[j].getY(); //出节点的左上
                        if (j === 4 || j === 1) {
                            if (j === 1) {
                                let refNodeExit = new Node({
                                    x: xj,
                                    y: yj + this.nodeClassHeight / 3 - 5, //出节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xi + this.nodeClassWidth / 3 - 5,
                                    y: yj + this.nodeClassHeight / 3 - 5, //参考节点2
                                });
                                let refNodeEnter = new Node({
                                    x: xi + this.nodeClassWidth / 3 - 5, //入节点的参考节点一
                                    y: yi, //出节点的参考节点一
                                });
                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            } else {
                                //3->4
                                let refNodeEnter = new Node({
                                    x: xi + this.nodeClassWidth / 3 - 5, //入节点的参考节点一
                                    y: yi + this.nodeClassHeight, //出节点的参考节点一
                                });
                                let refNodeExit = new Node({
                                    x: xj,
                                    y: yj + (this.nodeClassHeight / 3) * 2 - 5, //出节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xi + this.nodeClassWidth / 3 - 5,
                                    y: yj + (this.nodeClassHeight / 3) * 2 - 5, //参考节点2
                                });

                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            }
                        } else {
                            // 3 - > 2

                            let refNodeEnter = new Node({
                                x: xi + (this.nodeClassWidth / 3) * 2 - 5,
                                y: yi, //入节点的参考节点一
                            });
                            console.log(
                                xi,
                                yi,
                                refNodeEnter.getX(),
                                refNodeEnter.getY(),
                                "AGJLAGJLAJGLJG"
                            );
                            let refNodeMid1 = new Node({
                                x: xi + (this.nodeClassWidth / 3) * 2 - 5,
                                y: yi - this.rowHeight / 2, //中间参考节点1
                            });
                            let refNodeMid2 = new Node({
                                x: xj + this.nodeClassWidth / 3 - 5,
                                y: yj - this.rowHeight / 2 - 5, //中间参考节点2
                            });
                            let refNodeExit = new Node({
                                x: xj + this.nodeClassWidth / 3,
                                y: yj, //出节点的参考节点一
                            });
                            let relationEnterToMid1 = new UMLDependency({
                                a: refNodeEnter,
                                b: refNodeMid1,
                            });
                            let relationMid1ToMid2 = new UMLDependency({
                                a: refNodeMid1,
                                b: refNodeMid2,
                            });
                            let relationMid2ToExit = new UMLDependency({
                                a: refNodeMid2,
                                b: refNodeExit,
                            });
                            relationEnterToMid1.setDirection("none");
                            relationMid1ToMid2.setDirection("none");
                            this.classDiagram.addElement(relationEnterToMid1);
                            this.classDiagram.addElement(relationMid1ToMid2);
                            this.classDiagram.addElement(relationMid2ToExit);
                        }
                    } else if (i === 4) {
                        if (j === 2 || j === 3) {
                            // 4 - > 2
                            if (j === 2) {
                                ctx.font = "13px Arial";
                                ctx.fillText(
                                    str,
                                    centerPoint._x +
                                        this.nodeClassWidth / 2 +
                                        2,
                                    centerPoint._y
                                );
                                let refNodeEnter = new Node({
                                    x: xi + this.nodeClassWidth - 10,
                                    y: yi + (this.nodeClassHeight / 3) * 2 - 5, //入节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xj + (this.nodeClassWidth / 3) * 2 - 5,
                                    y: yi + (this.nodeClassHeight / 3) * 2 - 5, //参考节点2
                                });
                                let refNodeExit = new Node({
                                    x: xj + (this.nodeClassWidth / 3) * 2 - 5, //入节点的参考节点一
                                    y: yj + this.nodeClassHeight - 10, //出节点的参考节点一
                                });
                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            } else {
                                ctx.font = "13px Arial";
                                ctx.fillText(
                                    str,
                                    centerPoint._x -
                                        this.nodeClassWidth / 2 -
                                        300,
                                    centerPoint._y +
                                        this.nodeClassHeight / 2 +
                                        15
                                );
                                //4->3
                                let refNodeEnter = new Node({
                                    x: xi,
                                    y: yi + (this.nodeClassHeight / 3) * 2 - 5, //入节点的参考节点一
                                });
                                console.log(xi, yi, refNodeEnter, "4-.3");
                                let refNodeMid = new Node({
                                    x: xj + this.nodeClassWidth / 3 - 5,
                                    y: yi + (this.nodeClassHeight / 3) * 2 - 5, //参考节点2
                                });
                                let refNodeExit = new Node({
                                    x: xj + this.nodeClassWidth / 3 - 5, //入节点的参考节点一
                                    y: yj + this.nodeClassHeight - 5, //出节点的参考节点一
                                });
                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            }
                        } else {
                            //4->1
                            let refNodeEnter = new Node({
                                x: xi + this.nodeClassWidth - 10,
                                y: yi + this.nodeClassHeight / 3 - 5, //入节点的参考节点一
                            });
                            let refNodeMid1 = new Node({
                                x:
                                    xi +
                                    this.nodeClassWidth +
                                    this.columnwidth / 2 -
                                    5,
                                y: yi + this.nodeClassHeight / 3 - 5, //中间参考节点1
                            });
                            let refNodeMid2 = new Node({
                                x:
                                    xi +
                                    this.nodeClassWidth +
                                    this.columnwidth / 2 -
                                    5,
                                y: yj + (this.nodeClassHeight / 3) * 2 - 5, //中间参考节点2
                            });
                            let refNodeExit = new Node({
                                x: xj + this.nodeClassWidth - 10,
                                y: yj + (this.nodeClassHeight / 3) * 2 - 5, //出节点的参考节点一
                            });
                            let relationEnterToMid1 = new UMLDependency({
                                a: refNodeEnter,
                                b: refNodeMid1,
                            });
                            let relationMid1ToMid2 = new UMLDependency({
                                a: refNodeMid1,
                                b: refNodeMid2,
                            });
                            let relationMid2ToExit = new UMLDependency({
                                a: refNodeMid2,
                                b: refNodeExit,
                            });
                            relationEnterToMid1.setDirection("none");
                            relationMid1ToMid2.setDirection("none");
                            this.classDiagram.addElement(relationEnterToMid1);
                            this.classDiagram.addElement(relationMid1ToMid2);
                            this.classDiagram.addElement(relationMid2ToExit);
                        }
                    } else {
                        //i==2
                        if (j === 1 || j === 4) {
                            if (j === 1) {
                                //2->1
                                let refNodeEnter = new Node({
                                    x: xi + (this.nodeClassWidth / 3) * 2 - 5, //入节点的参考节点一
                                    y: yi, //出节点的参考节点一
                                });
                                let refNodeExit = new Node({
                                    x: xj + this.nodeClassWidth - 10,
                                    y: yj + this.nodeClassHeight / 3 - 5, //出节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xi + (this.nodeClassWidth / 3) * 2 - 5,
                                    y: yj + this.nodeClassHeight / 3 - 5, //参考节点2
                                });

                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            } else {
                                //2->4
                                let refNodeEnter = new Node({
                                    x: xi + (this.nodeClassWidth / 3) * 2 - 5, //入节点的参考节点一
                                    y: yi + this.nodeClassHeight - 10, //出节点的参考节点一
                                });
                                let refNodeExit = new Node({
                                    x: xj + this.nodeClassWidth - 10,
                                    y: yj + (this.nodeClassHeight / 3) * 2 - 5, //出节点的参考节点一
                                });
                                let refNodeMid = new Node({
                                    x: xi + (this.nodeClassWidth / 3) * 2 - 5,
                                    y: yj + (this.nodeClassHeight / 3) * 2 - 5, //参考节点2
                                });

                                let relationEnterToMid = new UMLDependency({
                                    a: refNodeEnter,
                                    b: refNodeMid,
                                });
                                let relationMidToExit = new UMLDependency({
                                    a: refNodeMid,
                                    b: refNodeExit,
                                });
                                relationEnterToMid.setDirection("none");
                                this.classDiagram.addElement(
                                    relationEnterToMid
                                );
                                this.classDiagram.addElement(relationMidToExit);
                            }
                        } else {
                            // 2->3
                            let refNodeEnter = new Node({
                                x: xi + this.nodeClassWidth / 3 - 5,
                                y: yi + this.nodeClassHeight - 10, //入节点的参考节点一
                            });
                            let refNodeMid1 = new Node({
                                x: xi + this.nodeClassWidth / 3 - 5,
                                y:
                                    yi +
                                    this.nodeClassHeight +
                                    this.rowHeight / 2 -
                                    5, //中间参考节点1
                            });
                            let refNodeMid2 = new Node({
                                x: xj + (this.nodeClassWidth / 3) * 2 - 5,
                                y:
                                    yj +
                                    this.nodeClassHeight +
                                    this.rowHeight / 2 -
                                    5, //中间参考节点2
                            });
                            let refNodeExit = new Node({
                                x: xj + (this.nodeClassWidth / 3) * 2 - 5,
                                y: yj + this.nodeClassHeight - 10, //出节点的参考节点一
                            });
                            let relationEnterToMid1 = new UMLDependency({
                                a: refNodeEnter,
                                b: refNodeMid1,
                            });
                            let relationMid1ToMid2 = new UMLDependency({
                                a: refNodeMid1,
                                b: refNodeMid2,
                            });
                            let relationMid2ToExit = new UMLDependency({
                                a: refNodeMid2,
                                b: refNodeExit,
                            });
                            relationEnterToMid1.setDirection("none");
                            relationMid1ToMid2.setDirection("none");
                            this.classDiagram.addElement(relationEnterToMid1);
                            this.classDiagram.addElement(relationMid1ToMid2);
                            this.classDiagram.addElement(relationMid2ToExit);
                        }
                    }
                }
            }
            this.classDiagram.interaction(true);
            // console.log(screenH, screenW, 'wh')
            this.classDiagram.draw();
        },
    },
    // },
    // },
    mounted() {
        let relationData = this.onImportExcel(this.propData.portPath);
        let relation = relationData["relation"];
        let selectedSwc = relationData["selectedSwc"];
        this.drawNode(selectedSwc);
        this.drawRelation(selectedSwc, relation);
    },
};
</script>
<style scoped>
/* @import "/static/Installation-Public/build/css/UDStyle.css"; */
</style>
