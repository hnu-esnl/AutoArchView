<template>
  <div id="content">
    <div class="svgTxt" id="svgTxt" style="height: 5000px"></div>
    <div id="svgTemplate" class="svgGraph"></div>
    <div>
      <canvas canvas></canvas>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
let xlsx = require("node-xlsx");
const fs = require("fs");
import Panzoom from "@panzoom/panzoom";
const { remote } = require("electron");

export default {
  props: ["propData"],

  data() {
    return {
      rightEventm: "",
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
      svgText: `<?xml version="1.0" encoding="UTF-8" standalone="no"?> 
            <root>
            <svg  version="1.1" xmlns="http://www.w3.org/2000/svg" width="230pt" height="2000pt" >
                <text font-size="14">`,
      // lineStyle: "line",
      svgTextXml: "", //保存的xml
      graph: `digraph g {
                 splines="ortho"/*定义直角边*/
              ratio=0.618;//横纵比
        rankdir = TB;       
        node[shape = record color = lightblue fontsize = 12];
        edge[forcelabels = true dir = forward   fontsize = 12  arrowhead = vee];
       \n`, //tail是箭头的尾巴
      contentHeight: 0,
      paintStr: "",
      excelData: [], //生成的excel表格的数据
    };
  },
  methods: {
    //将svg string转成html认识的标签
    stringToXml(xmlString) {
      let xmlDoc;
      if (typeof xmlString == "string") {
        //FF
        if (document.implementation.createDocument) {
          let parser = new DOMParser();
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
      graphviz.dot(this.graph, "svg").then((svg) => {
        this.svgXml = svg;
        let svgXml = this.stringToXml(svg);
        /**生成真实Dom */
        this.svgDom = svgXml.documentElement.cloneNode(true);
        let oSerializer = new XMLSerializer();
        /**生成虚拟dom */
        let sXML = oSerializer.serializeToString(this.svgDom);
        let Profile = Vue.extend({
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
        elem.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
      });
    },

    onImportExcel(file) {
      let svgTxtDom = document.getElementById("svgTxt");
      let svgTxt = svgTxtDom.innerHTML + this.svgText;
      let sheets = xlsx.parse(fs.readFileSync(file));
      let dataRow = []; //导出excel表格的每一行
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

      //   console.log(sheet,"我有没有排序呢")
      let str = "";
      let selectedNode = this.propData.selectedNode;
      let selectedSwc = [];
      // let nodeSwcArray = []; //存放某一个swc的node
      // let nodePortArray = []; //存放某一个swc的某一个port的node
      let node = {};
      //   let flag = -1; //解决循环跳转问题
      /**解决选择乱序的问题，我来测试一下 */

      // 第一步提取我需要的孙子节点
      let selectedPort = [];
      //我需要先给我选择的节点排个序
      for (let i = 0; i < selectedNode.length; i++) {
        if (selectedNode[i].hasOwnProperty("father")) {
          selectedPort.push(selectedNode[i]);
        }
      }
      // 第二步骤 排序
      selectedPort.sort(function (a, b) {
        if (a["father"] === b["father"]) {
          return a["label"].localeCompare(b["label"]);
        }
        return a["father"].localeCompare(b["father"]);
      });
      console.log(selectedPort, "我是排序之后的selectedPort");

      /**取到所有节点到selectedSwc里面表示被选择的swc数组*/
      for (let i = 0; i < selectedNode.length; i++) {
        //遍历选择的节点的爷爷,因为爷爷代表了组件swc只有send和receive都是我要的swc才是可以的
        if (
          (selectedNode[i].hasOwnProperty("children") ||
            selectedNode[i].hasOwnProperty("flagRswc")) &&
          selectedSwc.indexOf(selectedNode[i]["label"]) === -1
        ) {
          selectedSwc.push(selectedNode[i]["label"]);
        }
      }
      console.log(selectedSwc, "选择的swc");

      // selectedSwc.forEach((swc) => {
      //   str += `${swc}[label = "{${swc}| | }"]\n`;
      // });
      // console.log(selectedSwc, "接收的swc");
      let colorIndex = 0;
      let numEdge = 1;
      let msgHeight = 1; //记录左边消息的行高y;
      let portList = [];
      //外层循环找的是选到的port
      for (let j = 0; j < sheet.length; j++) {
        //内层循环找的是excel表格
        for (let i = 0; i <selectedPort.length; i++) {
          // flag = -1;
          if (
            selectedPort[i]["father"] === sheet[j][0] && //sendSwc
            selectedPort[i]["label"] === sheet[j][2] && //pPort
            selectedSwc.indexOf(sheet[j][1]) >= 0 //我的receiveSWC也在选择的节点里面
          ) {
            let sendName = sheet[j][0];
            let receiveName = sheet[j][1];
            let pPort = sheet[j][2];
            //第一次匹配上
            if (JSON.stringify(node) == "{}") {
              node = {
                sendName,
                receiveName,
                pPort,
                num: numEdge, //边的数量
              };
              portList.push(pPort);
              str += `${node["sendName"]}->${node["receiveName"]} [tooltip="${node["pPort"]}" xlabel = "${node["num"]}" color ="${this.colorList[colorIndex]}" fontcolor = "${this.colorList[colorIndex]}" ];\n`;
              svgTxt += `<tspan x="0" y=${msgHeight++ * 15}  fill = ${
                this.colorList[colorIndex]
              }>${node["num"]}. ${node["sendName"]} -> ${
                node["receiveName"]
              }</tspan>`;
              dataRow = [
                {
                  v: node["num"] + "." + node["pPort"],
                  s: {
                    font: {
                      color: {
                        rgb: this.colorList[colorIndex].slice(1),
                      },
                    }, //去掉前面的#才可以
                  },
                },
              ];
            }
            //node不是{}
            else if (
              node["sendName"] != sendName ||
              node["receiveName"] != receiveName
            ) {
              //发送接受组件或者pPort和上一个不同，说明有一条线要新增了
              //先把上一条线的port给填了
              portList.forEach((p) => {
                svgTxt += ` <tspan x="0" y=${msgHeight++ * 15}  fill = ${
                  this.colorList[colorIndex]
                }>${p}</tspan>`;
                dataRow.push({
                  v: p,
                  s: {
                    font: {
                      color: {
                        rgb: this.colorList[colorIndex].slice(1),
                      },
                    }, //去掉前面的#才可以
                  },
                });
              });
              this.excelData.push(dataRow);
              //新增一条边
              numEdge++;
              colorIndex = (colorIndex + 1) % this.colorList.length; //颜色改变了加一
              str += `${sendName}->${receiveName} [tooltip="${pPort}" xlabel = "${numEdge}" color ="${this.colorList[colorIndex]}" fontcolor = "${this.colorList[colorIndex]}" ]; \n`;
              svgTxt += `<tspan x="0" y=${msgHeight++ * 15}  fill = ${
                this.colorList[colorIndex]
              }>${numEdge}. ${sendName} -> ${receiveName}</tspan>
              <tspan x="0" y=${msgHeight++ * 15}  fill = ${
                this.colorList[colorIndex]
              }>${pPort}</tspan>`;
              portList = [];
              node = {
                sendName,
                receiveName,
                pPort,
                num: numEdge,
              };
              // node = {}
            } else {
              //port不同
              node = {
                sendName,
                receiveName,
                pPort,
                num: numEdge,
              };
              portList.push(pPort);
            }
          }
        }

        this.excelData.push(dataRow); //最后存到表格里面的data
      }
      if (portList.length > 0) {
        portList.forEach((port) => {
          svgTxt += ` <tspan x="0" y=${msgHeight++ * 15}  fill = ${
            this.colorList[colorIndex]
          }>${port}</tspan>`;
          dataRow.push({
            v: port,
            s: {
              font: {
                color: {
                  rgb: this.colorList[colorIndex].slice(1),
                },
              }, //去掉前面的#才可以
            },
          });
        });
        this.excelData.push(dataRow); //最后存到表格里面的data
      }
      svgTxt += `</text></svg></root>`;
      this.svgTextXml = svgTxt;
      svgTxtDom.innerHTML = svgTxt;
      if (str === "") {
        this.$alert("所选的组件之间没有交互，请重新选择", "warning", {
          confirmButtonText: "确定",
          callback: (action) => {},
        });
      }
      console.log("我是excel的data", this.excelData);
      return str;
    },
    downloadLeftPicSvg() {
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
              // this.$message({
              //     type: "info",
              //     message: `action: ${action}`,
              // });
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
    triggerDownload(imgURI) {
      let evt = new MouseEvent("click", {
        view: window,
        bubbles: false,
        cancelable: true,
      });
      let a = document.createElement("a");
      a.setAttribute("download", "MY_COOL_IMAGE.png");
      a.setAttribute("href", imgURI);
      a.setAttribute("target", "_blank");
      a.dispatchEvent(evt);
    },
    downloadRightPicSvg() {
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
      fs.writeFile(filePath, this.svgTextXml, (err) => {
        if (!err) {
          this.$alert("下载成功", "导出图片", {
            confirmButtonText: "确定",
            callback: (action) => {
              // this.$message({
              //     type: "info",
              //     message: `action: ${action}`,
              // });
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
    downloadRightPicSvg1() {
      let svg = this.svgTextXml;
      let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");
      let data = new XMLSerializer().serializeToString(svg);
      let DOMURL = window.URL || window.webkitURL || window;

      let img = new Image();
      let svgBlob = new Blob([data], {
        type: "image/svg+xml;charset=utf-8",
      });
      let url = DOMURL.createObjectURL(svgBlob);

      img.onload = function () {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        let imgURI = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");

        this.triggerDownload(imgURI);
      };

      img.src = url;
    },
    downloadRightExcel() {
      // alert('进来没')
      let s = {
        fill: {
          fgColor: { rgb: "C0504D" },
        },
      };
      let filePath = remote.dialog.showSaveDialog({
        title: "请选择要保存的表格路径",
        buttonLabel: "保存",
        filters: [
          {
            name: "Custom File Type",
            extensions: ["xlsx"],
          },
        ],
      });
      let buffer = xlsx.build([
        {
          name: "组件关系图表格",
          data: this.excelData,
        },
      ]);
      fs.writeFile(filePath, buffer, { flag: "w" }, function (err) {
        if (err) {
          // console.log('Hello.',err);
          throw err;
        } else {
          alert("保存成功");
        }
      });
    },
    // fs.writeFileSync('./testRight.xlsx',buffer,{'flag':'w'});//生成excel the_content是excel的名字，大家可以随意命名
    // },
    /**定义右键下载图片菜单栏的事件 **/
    rightEvent() {
      let rightTemplate = [
        {
          label: "保存图片（左）",
          accelerator: "ctrl+l",
          click: () => {
            this.downloadLeftPicSvg();
          },
        },
        // {
        //     label: "保存图片（右）",
        //     accelerator: "ctrl+r",
        //     click: () => {
        //         this.downloadRightPicSvg();
        //     },
        // },
        {
          label: "下载表格",
          accelerator: "ctrl+d",
          click: () => {
            this.downloadRightExcel();
          },
        },
      ]; //右键菜单的对象
      let m = remote.Menu.buildFromTemplate(rightTemplate); //建立菜单
      return m;
    },
    bindEvent(e) {
      //添加右键监听事件
      // console.log(this.rightEventm, "remove");
      e.preventDefault();
      this.rightEventm.popup({ window: remote.getCurrentWindow() });
    },
  },
  mounted() {
    console.log("mounted Port merge");
    this.contentHeight = this.propData.height;
    this.nodes = this.propData.selectedNode;
    console.log(this.propData);
    this.paintStr = this.onImportExcel(this.propData.swcInterPath);
    this.graph += this.paintStr + `};`;
    this.drawSvg();
    this.rightEventm = this.rightEvent();
    console.log(this.rightEventm, "?");
    window.addEventListener("contextmenu", this.bindEvent);
    this.$on("hook:beforeDestroy", () => {
      console.log(this.rightEventm, "r");
      window.removeEventListener("contextmenu", this.bindEvent);
    });
  },
  beforeDestroy() {
    // window.removeEventListener("contextmenu", (e) => {
    //     //添加右键监听事件
    //     console.log(this.rightEventm, "remove");
    //     e.preventDefault();
    //     this.rightEventm.popup({ window: remote.getCurrentWindow() });
    // });
    // console.log("我销毁了吗？我是portMerge");
  },
};
</script>
<style scoped>
#content {
}
.svgGraph {
  float: left;
}

.svgTxt {
  float: right;
  white-space: pre-line;
  /* height: 900px; */
}
</style>
