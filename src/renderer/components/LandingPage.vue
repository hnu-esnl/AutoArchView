<template>
  <div id="mainpage" class="stretch" ref="mainpage">
    <Layout>
      <Header id="toolbar">
        <el-button
          type="primary"
          icon="el-icon-upload2"
          size="small"
          @click.left="loadFolder"
          >upload</el-button
        >
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click.left="overView"
          :disabled="flag"
          >showSwcTable</el-button
        >
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click.left="showGraph"
          :disabled="flag"
          >showSwcInteract</el-button
        >
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click.left="showRunnableRelationGraph"
          :disabled="flag"
          >showRunInteract</el-button
        >
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click.left="showDynamic"
          :disabled="flag"
          >visualization</el-button
        >
      </Header>
      <Content :ref="'content'">
        <div class="stretch">
          <!-- tabs 的value属性的值就是当前激活的tabpane，对应的是tabpane的name属性的值 -->
          <!-- 当点击了小叉叉就会触发on-tab-remove的事件 -->
          <Tabs
            type="card"
            @on-tab-remove="handleTabRemove"
            :animated="false"
            v-model="activeTabName"
          >
            <!-- v-for表明有几个标签页 -->
            <TabPane
              v-for="tab in allTabs"
              :key="tab.name"
              :label="tab.title"
              :name="tab.name"
              :closable="tab.closable"
            >
              <component
                v-if="tab.name === activeTabName && flagSequence"
                v-bind:is="tab.component"
                :propData="tab.componentData"
                :key="timer"
              ></component>
              <!-- :propMethods="tab.componentMethods" -->
            </TabPane>
          </Tabs>
        </div>
      </Content>

      <el-dialog
        title="Visualization"
        :visible.sync="centerDialogVisible"
        center
        :close-on-click-modal="false"
        :width="'90%'"
      >
        <span>
          <el-row>
            <el-col :span="12">
              <el-card
                class="box-card"
                shadow="hover"
                :body-style="{
                  padding: '10px',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  height: '350px',
                }"
              >
                <div slot="header">
                  <span>Configuration</span>
                </div>

                <el-form ref="form" label-width="150px">
                  <el-form-item label="view type">
                    <el-radio label="sequence" v-model="radio"
                      >SequenceGraph</el-radio
                    >
                    <el-radio label="swcDynamic" v-model="radio"
                      >SwcInterGraph(Dyn)</el-radio
                    >
                    <el-radio label="runDynamic" v-model="radio"
                      >RunInterGraph(Dyn)</el-radio
                    >
                    <el-radio label="swcStatic" v-model="radio"
                      >SwcInterGraph(Static)</el-radio
                    >
                    <el-radio label="runStatic" v-model="radio"
                      >RunInterGraph(Static)</el-radio
                    >
                    <!-- <el-radio label="staticLayout" v-model="radio">静态关系布局图</el-radio> -->
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card
                class="box-card"
                shadow="hover"
                :body-style="{
                  padding: '10px',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  height: '350px',
                }"
              >
                <div slot="header">
                  <span>Choose Data</span>
                </div>
                <el-input
                  placeholder="Please input keywords to filter"
                  v-model="stringValue"
                ></el-input>
                <el-checkbox
                  v-show="showcheckAll"
                  v-model="checkAll"
                  @change="handleCheckAllChange"
                  >selectAll</el-checkbox
                >
                <el-tree
                  ref="visTree"
                  :data="filData"
                  show-checkbox
                  node-key="id"
                  @check="currentChecked"
                  :props="defaultProps"
                ></el-tree>
              </el-card>
            </el-col>
          </el-row>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="centerDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="exeVisualization"
            >Confirm</el-button
          >
        </span>
      </el-dialog>

      <!-- <Footer id="information-bar">
                <div class="stretch"></div>
            </Footer>-->
    </Layout>
  </div>
</template>
<script>
let xlsx = require("node-xlsx");
const fs = require("fs");
// var { ipcRenderer } = require("electron");
// import { getFolder } from "../libs/getFolder.js";
// import { getXmlData } from "../libs/readPort.js";

// import showSequence from "./sequenceGraph.vue";
import showSequence from "./sequenceGraphEH.vue";
import showFD from "./showFD.vue";
import WelcomePage from "./WelcomePage";
import overView from "./overView.vue";
import staticGraph from "./staticGraph.vue";
import GraphvizRunnable from "./GraphvizRunnable.vue";
import GraphvizSwc from "./GraphvizPortSwc.vue";
import RunnableRealtion from "./RunnablerelationGraph.vue";
import showRunnableInteract from "./showRunnableInteract.vue";
const path = require("path");
// var SqliteDB = require("../libs/sqlite3.js").SqliteDB;
export default {
  mounted: function () {
    this.openWelcome();
  },
  data() {
    return {
      centerDialogVisible: false, //动态视图选择窗口
      flag: true, //没有导入文件前其他的按钮的禁用状态默认是true，被禁用
      flagSequence: true, //时序图重复点击的显示问题
      checkAll: false, //动态图的全选，默认是false
      showcheckAll: false, //全选框的显示，默认是false不显示
      relationPath: "\\RELATION INFO.xlsx",
      runnableRelationPath: "\\RUNNABLERELATION INFO.xlsx",
      sequencePath: "\\TASK INFO.xlsx",
      portPath: "\\PORT INFO.xlsx",
      swcInterPath: "\\PORT MATCH INFO.xlsx",
      // messagePath: "\\MESSAGE INFO.xlsx",
      osPriorityPath: "\\OS PRIORITY.xlsx",
      runnablePath: "\\Runnable MATCH INFO.xlsx",
      systemPath: "",
      mainpageHeight: 600,
      mainpageWidth: 800,
      splitValue: 0.5,
      fileList: [],
      portList: [],
      swcList: [],
      activeTabName: "1", //tabs的value也就是被激活tabpane的name
      allTabs: [],
      lockedTab: null,
      overViewTab: null,
      showGraphTab: null,
      showDynamicTab: null,
      showStaticTab: null,
      showRunnableTab: null,
      showRunnableRelationTab: null,
      // showStaticLayoutTab: null,
      showSequenceTab: null,
      showRunnableInteractTab: null,
      radio: "",
      dynamicSelectedNode: [], // 动态关系图选中的节点
      sequenceSelectedNode: [],
      staticSelectedNode: [],
      runnableSelectedNode: [],
      runnableInteractSelectedNode: [],
      treeData: [], //动态图中的全部选择节点
      filData: [], //动态图中的选择节点的搜索框
      timer: "-1", //对应的是挂载租件的key，可以实现重复挂载
      stringValue: "", //动态图的关键字过滤
      defaultProps: {
        children: "children",
        label: "label",
      },
      checkedNodes: [],
      checkedKeys: [],
    };
  },
  computed: {
    contentHeight() {
      return this.mainpageHeight - 73;
    },
  },
  watch: {
    radio: {
      //监控单选框的变化
      // immediate: true,
      handler(newVal) {
        this.$refs.visTree.setCheckedNodes([]);
        this.$refs.visTree.setCheckedKeys([]);
        this.checkAll = false;
        this.stringValue = "";
        if (newVal === "sequence") {
          this.treeData = this.onImportExcelTask(this.sequencePath);
          this.filData = this.treeData;
        } else if (newVal === "swcStatic") {
          this.treeData = this.onImportExcelPort(this.swcInterPath);
          this.filData = this.treeData;
        } else if (newVal === "swcDynamic") {
          this.treeData = this.onImportExcelRelation(this.relationPath);
          this.filData = this.treeData;
        } else if (newVal === "runDynamic") {
          this.treeData = this.onImportRunnableExcelRelation(
            this.runnableRelationPath
          );
          this.filData = this.treeData;
        } else {
          // console.log(newVal, "runStatic");
          this.treeData = this.onImportExcelRunnable(this.runnablePath);
          this.filData = this.treeData;
        }

        this.showcheckAll = true;
      },
    },
    //选择框过滤
    stringValue(newVal) {
      console.log(newVal.length, "newVal");
      // if (newVal.length !== 0) {
      //     this.checkedNodes = [];
      //     this.$refs.visTree.setCheckedNodes([]);
      //     this.$refs.visTree.setCheckedKeys([]);
      //     this.checkAll = false;
      //     console.log(this.$refs.visTree.getCheckedNodes());
      // }
      this.checkedKeys = this.$refs.visTree.getCheckedKeys();
      this.checkAll = false;

      // this.$refs.visTree.setCheckedKeys()
      this.filData = this.treeData.filter((item) => {
        //实现两层过滤，第三层没有写，我不想写了
        if (item.hasOwnProperty("children")) {
          if (item["children"] !== null) {
            let childfilter = false;
            item["children"].forEach((child) => {
              if (
                child["label"].toLowerCase().indexOf(newVal.toLowerCase()) != -1
              ) {
                childfilter = true;
              }
            });
            return (
              childfilter ||
              item["label"].toLowerCase().indexOf(newVal.toLowerCase()) != -1
            );
          }
        } else {
          return (
            item["label"].toLowerCase().indexOf(newVal.toLowerCase()) != -1
          );
        }
      });
      this.$refs.visTree.setCheckedNodes(this.checkedNodes);
      this.$refs.visTree.setCheckedKeys(this.checkedKeys);
      console.log(this.$refs.visTree.getCheckedKeys(), "筛选");
    },
  },
  methods: {
    /**读取文件**/
    onImportExcelRelation(file) {
      let sheets = xlsx.parse(fs.readFileSync(file));
      // 获取上传的文件对象
      // console.log(sheets);
      // 遍历 sheet
      let sheet = sheets[0].data;
      let vertex = sheet[0];
      vertex.shift();
      let id = 0;
      return vertex.map((item) => {
        let obj = {};
        obj["label"] = item;
        obj["id"] = id;
        id++;
        return obj;
      });
    },
    onImportRunnableExcelRelation(file) {
      let sheets = xlsx.parse(fs.readFileSync(file));
      // 获取上传的文件对象
      // console.log(sheets);
      // 遍历 sheet
      let sheet = sheets[0].data;
      let vertex = sheet[0];
      vertex.shift();
      let id = 0;
      return vertex.map((item) => {
        let obj = {};
        obj["label"] = item;
        obj["id"] = id;
        id++;
        return obj;
      });
    },
    onImportExcelTask(file) {
      let sheets = xlsx.parse(fs.readFileSync(file));
      // let osPrioritySheet = [];
      // //说明导入文件的时候有这个优先级的文件了

      // 获取上传的文件对象
      // console.log(sheets);
      // 遍历 sheet
      let sheet = sheets[0].data;
      let dataTree = []; //节点数组，用来显示和选择节点
      let id = 0;
      let swcName = []; //维护一个swc的数组，代表树的第一层
      for (let i = 1; i < sheet.length; i++) {
        let index = swcName.indexOf(sheet[i][0]);
        // console.log(index, "我是index");
        if (index < 0) {
          //说明树的第一层没有这个节点添加上
          swcName.push(sheet[i][0]);
          let treeObject = {};
          treeObject["id"] = id;
          id++;
          treeObject["label"] = sheet[i][0];
          //加上该节点的第一个孩子
          let childrenName = sheet[i][2].split("/").slice(-1)[0];
          let childrenObj = {};
          childrenObj["label"] = childrenName;
          childrenObj["id"] = id;
          childrenObj["father"] = sheet[i][0]; //标识一下孩子的爸爸
          id++;
          treeObject["children"] = [childrenObj];
          dataTree.push(treeObject);
        }
        //说明已经出现过这个节点了第二次出现的就是它的孩子children
        else {
          let childrenName = sheet[i][2].split("/").slice(-1)[0];
          // console.log(childrenName, "我是孩子的名字");
          //节点有孩子，则继续添加二胎三胎...
          let childrenObj = {};
          childrenObj["label"] = childrenName;
          childrenObj["id"] = id;
          childrenObj["father"] = sheet[i][0]; //标识一下孩子的爸爸
          //看看有没有重复的孩子
          let childrenList = dataTree[index]["children"].filter((item) => {
            return item["label"] === childrenName;
          });
          if (childrenList.length === 0) {
            dataTree[index]["children"].push(childrenObj);
            id++;
          }
        }
      }
      console.log(dataTree, "我是dataTree");

      return dataTree;
    },
    onImportExcelPort(file) {
      let sheets = xlsx.parse(fs.readFileSync(file));
      // 获取上传的文件对象
      // 遍历 sheet
      let sheet = sheets[0].data;

      let dataTree = []; //节点数组，用来显示和选择节点
      let id = 0;
      let swcName = []; //维护一个swc的数组，代表树的第一层
      let portName = []; //维护port数组
      for (let i = 1; i < sheet.length; i++) {
        let index = swcName.indexOf(sheet[i][0]);
        let index1 = swcName.indexOf(sheet[i][1]);
        //console.log(index, "我是index");
        if (index < 0) {
          //说明树的第一层没有这个节点添加上
          swcName.push(sheet[i][0]);
          let treeObject = {};
          let childrenObj = {};
          let childrenName = sheet[i][2];
          treeObject["id"] = id;
          id++;
          treeObject["label"] = sheet[i][0];

          //加上节点的第一个孩子，是做为接受节点来使用的
          let childrenRecieve = {};
          let receiveSwcName = sheet[i][0];
          childrenRecieve["label"] = receiveSwcName;
          childrenRecieve["id"] = id;
          childrenRecieve["flagRswc"] = "Rswc";
          id++;
          //孩子
          childrenObj["id"] = id;
          id++;
          childrenObj["label"] = childrenName;
          childrenObj["father"] = receiveSwcName;
          // //孙子
          // msgObj["id"] = id;
          // msgObj["label"] = sheet[i][2];
          // // msgObj["grandfather"] = sheet[i][0]; //给孙子加个爷爷
          // msgObj["father"] = sheet[i][2]; //给孙子加个爸爸
          // childrenObj["children"] = [msgObj];
          // id++;
          treeObject["children"] = [childrenRecieve, childrenObj];
          dataTree.push(treeObject);
        } else if (index1 < 0) {
          swcName.push(sheet[i][1]);
          let treeObject = {};
          //   let childrenName = sheet[i][2];
          treeObject["id"] = id;
          id++;
          treeObject["label"] = sheet[i][1];

          //加上节点的第一个孩子，是做为接受节点来使用的
          let childrenRecieve = {};
          let receiveSwcName = sheet[i][1];
          childrenRecieve["label"] = receiveSwcName;
          childrenRecieve["id"] = id;
          childrenRecieve["flagRswc"] = "Rswc";
          id++;
          treeObject["children"] = [childrenRecieve];
          dataTree.push(treeObject);
        }

        //说明已经出现过这个节点了第二次出现的就是它的孩子children
        else {
          let childrenName = sheet[i][2];
          // let msgName = sheet[i][3];
          //判断port孩子是否出现过
          //port没有出现过
          //console.log(childrenName, "我是孩子的名字");
          let childrenObj = {};
          // let msgObj = {};
          childrenObj["label"] = childrenName;
          childrenObj["id"] = id;
          childrenObj["father"] = sheet[i][0];
          id++;
          dataTree[index]["children"].push(childrenObj);
        }
      }
      return dataTree;
    },
    onImportExcelRunnable(file) {
      let sheets = xlsx.parse(fs.readFileSync(file));
      // 获取上传的文件对象
      // 遍历 sheet
      let sheet = sheets[0].data;
      let dataTree = []; //节点数组，用来显示和选择节点
      let id = 0;
      let runnableName = []; //维护一个swc的数组，代表树的第一层
      for (let i = 1; i < sheet.length; i++) {
        let index = runnableName.indexOf(sheet[i][0]);
        if (index < 0) {
          let portName = []; //维护port数组
          //说明树的第一层没有这个节点添加上
          runnableName.push(sheet[i][0]);
          let treeObject = {};
          let childrenObj = {};
          let childrenName = sheet[i][2];
          treeObject["id"] = id;
          treeObject["label"] = sheet[i][0];
          treeObject["runnable"] = true;
          id++;
          //孩子
          childrenObj["id"] = id;
          id++;
          childrenObj["label"] = childrenName;

          portName[0] = childrenObj;
          treeObject["children"] = portName;
          dataTree.push(treeObject);
        }
        //说明已经出现过这个节点了第二次出现的就是它的孩子children
        else {
          let childFlag = false;
          let childrenName = sheet[i][2];

          let childrenArray = dataTree[index]["children"]; //得到当前runnable的孩子数组
          // console.log(childrenName);
          for (let child of childrenArray) {
            if (child["label"] === childrenName) {
              //说明这个孩子已经有了
              childFlag = true;
              break;
            }
          }
          if (!childFlag) {
            //只有这个孩子也是第一次出现我再给它加上孩子
            let childrenObj = {};
            childrenObj["label"] = childrenName;
            childrenObj["id"] = id;
            id++;
            dataTree[index]["children"].push(childrenObj);
          }
        }
      }
      return dataTree;
    },

    addNewTab({
      title,
      componentData,
      // componentMethods,
      component,
      setActive = true,
    }) {
      const newTabName = title;
      let newTab = {
        title: title,
        name: newTabName,
        componentData: componentData,
        // componentMethods: componentMethods,
        component: component,
        closable: true,
      };
      console.log(this.allTabs, "allTabs");
      this.allTabs.push(newTab);
      if (setActive) {
        this.activeTabName = newTabName;
      }
      return newTab;
    },
    openWelcome() {
      let componentData = {
        height: this.contentHeight,
        width: this.contentWidth,
      };

      let tabTitle = "Welcome";
      // let componentMethods = {};
      this.addNewTab({
        title: tabTitle,
        component: WelcomePage,
        componentData,
      });
    },

    /**传递的参数是tabpane的name来标识哪个tabpane被关闭了**/
    handleTabRemove(targetName) {
      let tabs = this.allTabs;
      let activeName = this.activeTabName;
      console.log(targetName, "targetRemove");
      if (this.overViewTab != null) {
        if (this.overViewTab.name === targetName) {
          this.overViewTab = null;
        }
      }

      if (this.showGraphTab != null) {
        if (this.showGraphTab.name === targetName) {
          this.showGraphTab = null;
        }
      }
      if (this.showDynamicTab != null) {
        if (this.showDynamicTab.name === targetName) {
          this.showDynamicTab = null;
        }
      }

      if (this.showSequenceTab != null) {
        if (this.showSequenceTab.name === targetName) {
          this.showSequenceTab = null;
        }
      }
      if (this.showStaticTab != null) {
        if (this.showStaticTab.name === targetName) {
          this.showStaticTab = null;
        }
      }
      if (this.showRunnableTab != null) {
        if (this.showRunnableTab.name === targetName) {
          this.showRunnableTab = null;
        }
      }
      if (this.showRunnableInteractTab !== null) {
        if (this.showRunnableInteractTab.name === targetName) {
          this.showRunnableInteractTab = null;
        }
      }
      if (this.showRunnableRelationTab != null) {
        if (this.showRunnableRelationTab.name === targetName) {
          this.showRunnableRelationTab = null;
        }
      }
      this.allTabs = tabs.filter((tab) => tab.name !== targetName);
    },
    /**添加组件信息表的component*/
    overView() {
      if (this.overViewTab != null) {
        this.activeTabName = this.overViewTab.name;
        return false;
      }
      let componentData = {
        height: this.contentHeight,
        // folders: folders,
        portPath: this.portPath,
      };
      let tabTitle = "组件信息表";

      this.overViewTab = this.addNewTab({
        title: tabTitle,
        component: overView,
        componentData,
      });

      console.log(this.activeTabName, "activeName");
    },
    /**打开动态图的对话框**/
    showDynamic() {
      this.centerDialogVisible = true;
    },
    /**新增静态图tab**/
    showGraph() {
      if (this.showGraphTab != null) {
        this.activeTabName = this.showGraphTab.name;
        return false;
      }
      let componentData = {
        height: this.contentHeight,
        relationPath: this.relationPath, //对应的excel的路径
        // folders: folders,
      };
      let tabTitle = "组件信息图";

      this.showGraphTab = this.addNewTab({
        title: tabTitle,
        component: staticGraph,
        componentData,
      });
    },
    showRunnableRelationGraph() {
      if (this.showRunnableRelationTab != null) {
        this.activeTabName = this.showRunnableRelationTab.name;
        return false;
      }
      let componentData = {
        height: this.contentHeight,
        relationPath: this.runnableRelationPath, //对应的excel的路径
        // folders: folders,
      };
      let tabTitle = "RunInterGraph(Dyn)";

      this.showRunnableRelationTab = this.addNewTab({
        title: tabTitle,
        component: RunnableRealtion,
        componentData,
      });
    },
    /**导入文件对话框**/
    loadFolder() {
      const { remote } = require("electron");
      // const { ipcRenderer } = require("electron");
      // const that = this;

      let selectedDirectories = remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
          properties: ["openDirectory", "multiSelections"],
        }
      );
      this.systemPath = selectedDirectories[0];
      console.log(this.systemPath, "systemPath");
      // this.relationPath = "\\RELATION INFO.xlsx";
      // this.portPath = "\\PORT INFO.xlsx";
      // this.sequencePath = "\\TASK INFO.xlsx";
      // this.messagePath = "\\MESSAGE INFO.xlsx";
      this.relationPath = selectedDirectories[0] + this.relationPath;
      this.portPath = selectedDirectories[0] + this.portPath;
      this.sequencePath = selectedDirectories[0] + this.sequencePath;
      this.swcInterPath = selectedDirectories[0] + this.swcInterPath;
      // this.messagePath = selectedDirectories[0] + this.messagePath;
      this.runnablePath = selectedDirectories[0] + this.runnablePath;
      this.runnableRelationPath =
        selectedDirectories[0] + this.runnableRelationPath;
      if (
        !fs.existsSync(this.relationPath) ||
        !fs.existsSync(this.portPath) ||
        !fs.existsSync(this.sequencePath) ||
        !fs.existsSync(this.swcInterPath)
      ) {
        this.$alert("缺少表格，请重新导入！", "error", {
          confirmButtonText: "确定",
          callback: (action) => {},
        });
      } else {
        this.flag = false;
        this.$alert("导入成功！", "success", {
          confirmButtonText: "确定",
          callback: (action) => {},
        });
      }
    },
    /**可视化图全选 */
    handleCheckAllChange(val) {
      this.checkAll = val;
      if (this.checkAll) {
        this.$refs.visTree.setCheckedNodes(this.filData);
        if (this.radio === "swcStatic") {
          this.$alert("所选组件过多，无法查看！", "warning", {
            confirmButtonText: "确定",
            callback: (action) => {},
          });
        } else if (this.radio === "sequence") {
          this.$alert("所选组件过多，无法查看！", "warning", {
            confirmButtonText: "确定",
            callback: (action) => {},
          });
        } else if (this.radio === "runStatic") {
          let keys = [];

          this.filData.forEach((tree) => {
            keys.push(tree["id"]);
          });
          this.$refs.visTree.setCheckedKeys(keys);
          this.checkedNodes = this.$refs.visTree.getCheckedNodes();
          // console.log(this.checkedNodes);
          this.runnableSelectedNode = this.checkedNodes; //runnableSelectedNode是我要传输的东西
        } else if (this.radio === "runDynamic") {
          this.runnableInteractSelectedNode = this.filData;
          this.checkedNodes = this.filData;
          console.log(this.checkedNodes, "全选的节点");
        } else {
          this.dynamicSelectedNode = this.filData;
          this.checkedNodes = this.filData;
        }
      } else {
        this.$refs.visTree.setCheckedKeys([]);
        this.dynamicSelectedNode = [];
        this.sequenceSelectedNode = [];
        this.sequenceSelectedNode = [];
      }
    },
    /** 可视化图中选择节点 */
    currentChecked(nodeObj, SelectedObj) {
      this.checkedNodes = SelectedObj.checkedNodes;
      // SelectedObj.checkedNodes = this.treeData;
      if (this.radio === "sequence") {
        this.sequenceSelectedNode = this.checkedNodes;
      } else if (this.radio === "swcDynamic") {
        this.dynamicSelectedNode = this.checkedNodes;
      } else if (this.radio === "swcStatic") {
        console.log("静态静态静态！");
        this.staticSelectedNode = this.checkedNodes;
      } else if (this.radio === "runDynamic") {
        this.runnableInteractSelectedNode = this.checkedNodes;
        console.log(this.checkedNodes, "选中的节点数组"); // 这是选中的节点数组
      } else {
        //radio= "runStatic"
        this.runnableSelectedNode = this.checkedNodes;
      }
    },
    /**可视化选择了显示哪个图(时序或者是静动态关系图)  */
    exeVisualization() {
      //说明没选那就报错弹框
      if (this.checkedNodes.length === 0) {
        alert("选择的数据为空请重新选择！");
      } else {
        this.centerDialogVisible = false; //先关闭对话框
        /**加载多个组件动态关系图**/
        if (this.radio === "swcDynamic") {
          // console.log(selectedNode, "ZHEWAGLAJG");
          /**如果已经存在动态图的tab 重新加载页面，重新传递数据 */
          if (this.showDynamicTab) {
            this.allTabs.forEach((item) => {
              console.log("第二次重传");
              if (item.title === "组件关系图可视化") {
                item.componentData.selectedNode = this.dynamicSelectedNode;
              }
            });
            this.timer = new Date().getTime(); //重新渲染页面
            this.activeTabName = this.showDynamicTab.name;
          } else {
            /**如果页面不存在新增一个动态图的页面，add一个tab */
            let componentData = {
              height: this.contentHeight,
              selectedNode: this.dynamicSelectedNode, //传递了选择的组件的节点
              relationPath: this.relationPath,
              // folders: folders,
            };
            console.log(componentData.selectedNode, "?");

            let tabTitle = "组件关系图可视化";

            this.showDynamicTab = this.addNewTab({
              title: tabTitle,
              component: showFD,
              componentData,
            });
            // this.timer = new Date().getTime();
          }
        } else if (this.radio === "sequence") {
          /**加载时序图**/
          if (this.showSequenceTab) {
            // this.flagSequence = false; //销毁时序图

            this.allTabs.forEach((item) => {
              if (item.title === "sequenceGraph") {
                item.componentData.selectedNode = this.sequenceSelectedNode;
              }
            });
            this.timer = new Date().getTime();
            // console.log(this.timer, "2");
            this.activeTabName = this.showSequenceTab.name;
          } else {
            /**如果页面不存在新增一个时序图的页面，add一个tab */
            // this.flagSequence = true;
            let componentData = {
              height: this.contentHeight,
              selectedNode: this.sequenceSelectedNode, //传递了选择的组件的节点
              sequencePath: this.sequencePath,
              systemPath: this.systemPath,
              // folders: folders,
            };
            let tabTitle = "sequenceGraph";

            this.showSequenceTab = this.addNewTab({
              title: tabTitle,
              component: showSequence,
              componentData,
            });
          }
        } else if (this.radio === "swcStatic") {
          /**加载多个组件的静态关系图 */
          if (this.showStaticTab) {
            this.allTabs.forEach((item) => {
              if (item.title === "swcInter(Static)") {
                item.componentData.selectedNode = this.staticSelectedNode;
              }
            });
            this.timer = new Date().getTime();
            this.activeTabName = this.showStaticTab.name;
          } else {
            /**如果页面不存在新增一个静态图的页面，add一个tab */
            let componentData = {
              height: this.contentHeight,
              selectedNode: this.staticSelectedNode, //传递了选择的组件的节点
              swcInterPath: this.swcInterPath,
              // folders: folders,
            };
            let tabTitle = "swcInter(Static)";
            this.showStaticTab = this.addNewTab({
              title: tabTitle,
              component: GraphvizSwc,
              componentData,
            });

            // this.timer = new Date().getTime();
          }
        } else if (this.radio === "runDynamic") {
          // console.log(this.checkedNodes, "ruoajglajgljg");
          /**如果已经存在动态图的tab 重新加载页面，重新传递数据 */
          this.runnableInteractSelectedNode = this.checkedNodes;
          if (this.showRunnableInteractTab) {
            this.allTabs.forEach((item) => {
              console.log("第二次重传");
              if (item.title === "runInter(Static)") {
                item.componentData.selectedNode =
                  this.runnableInteractSelectedNode;
              }
            });
            this.timer = new Date().getTime(); //重新渲染页面
            this.activeTabName = this.showRunnableInteractTab.name;
          } else {
            /**如果页面不存在新增一个动态图的页面，add一个tab */
            let componentData = {
              height: this.contentHeight,
              selectedNode: this.runnableInteractSelectedNode, //传递了选择的组件的节点
              relationPath: this.runnableRelationPath,
              // folders: folders,
            };
            console.log(componentData.selectedNode, "?");

            let tabTitle = "runnable交互可视化";

            this.showRunnableInteractTab = this.addNewTab({
              title: tabTitle,
              component: showRunnableInteract,
              componentData,
            });
            // this.timer = new Date().getTime();
          }
        } else {
          //raido === "runStatic"
          console.log(this.radio + "radio");
          if (this.showRunnableTab) {
            this.allTabs.forEach((item) => {
              if (item.title === "RunnableMatchVal") {
                item.componentData.selectedNode = this.runnableSelectedNode;
              }
            });
            this.timer = new Date().getTime();
            this.activeTabName = this.showRunnableTab.name;
          } else {
            /**如果页面不存在新增一个静态图的页面，add一个tab */
            let componentData = {
              height: this.contentHeight,
              selectedNode: this.runnableSelectedNode, //传递了选择的组件的节点
              runnablePath: this.runnablePath,
              // folders: folders,
            };
            let tabTitle = "RunnableMatchVal";
            this.showRunnableTab = this.addNewTab({
              title: tabTitle,
              component: GraphvizRunnable,
              componentData,
            });
          }
        }
      }
    },
  },
};
</script>
<style scoped>
.split-pane {
  padding: 10px;
}

html,
body,
.ivu-layout,
.stretch {
  margin: 0px;
  padding: 0px;
  height: 100%;
}

#toolbar {
  height: 50px;
  line-height: 50px;
  color: #fff;
}
.toolbar-button {
  font-size: 30px;
}
#information-bar {
  position: absolute;
  background-color: #007acc;
  color: #fff;
  height: 20px;
  margin: 0px;
  padding: 0px;

  top: 50px;
}
#aside-toolbar-tmp {
  background-color: #fff;
}

#aside-toolbar {
  font-size: 15px;
  background-color: #007acc;
  color: #fff;
  /* color: aliceblue; */
  /* background-color: darkslategrey; */
}

#resource-tree-tmp {
  background-color: #fff;
  padding-left: 0px;
  padding-right: 0px;
}

.success {
  color: #67c23a;
}

.warning {
  color: #e6a23c;
}

#button {
  font-size: 14px;
}

.ivu-tabs-bar {
  margin-bottom: 0px;
}

/* 设置滚动条的样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset006pxrgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.1);
  -webkit-box-shadow: inset006pxrgba(0, 0, 0, 0.5);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(129, 129, 129, 0.4);
}
</style>
