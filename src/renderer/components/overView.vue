<template>
    <div>
        <span>PORT总数量:{{ number }}个</span>
        <el-input
            class="fl"
            placeholder="请输入搜索的PORT名称"
            suffix-icon="el-icon-date"
            v-model="intName"
        ></el-input>

        <!-- 分页栏 -->
        <div class="block">
            <el-pagination
                class="fy"
                layout="prev, pager, next"
                @current-change="current_change"
                :total="total"
                :page-size="pagesize"
                background
            ></el-pagination>
        </div>

        <el-table
            :data="
        filData.slice((currentPage - 1) * pagesize, currentPage * pagesize)
      "
            border
            style="width: 100%"
        >
            <el-table-column prop="SWC-NAME" label="SWC名" width="180"></el-table-column>
            <el-table-column prop="PORT-NAME" label="Port名" width="180"></el-table-column>
            <el-table-column prop="PORT-TYPE" label="Port类型"></el-table-column>
            <el-table-column prop="INTERFACE-DEST" label="接口"></el-table-column>
            <el-table-column prop="INTERFACE-TYPE" label="接口类型"></el-table-column>
        </el-table>
    </div>
</template>


<script>
let xlsx = require("node-xlsx");
const fs = require("fs");
export default {
    name: "tableList",
    props: ["propData"],
    data() {
        return {
            //index: 1,
            intName: "",
            //flag: false,
            tableData: [],
            // total: 6600, //默认数据总数
            pagesize: 20, //每页的数据条数
            currentPage: 1, //默认开始页
        };
    },
    mounted() {
        let filePath = this.propData.portPath;
        // console.log(filePath, "filepath");
        this.onImportExcel(filePath);
        // this.total = this.tableData.length;
        // console.log(this.total, "wulalalalal");
    },

    computed: {
        total() {
            return this.filData.length;
        },
        number: {
            get() {
                return this.filData.length;
            },
        },
        filData: {
            get: function () {
                var a = this.tableData.filter((t) => {
                    return (
                        t["PORT-NAME"]
                            .toLowerCase()
                            .indexOf(this.intName.toLowerCase()) !== -1
                    );
                });
                this.currentPage = 1;
                return a;
            },
        },
    },
    methods: {
        onImportExcel(file) {
            let sheets = xlsx.parse(fs.readFileSync(file));
            // 获取上传的文件对象
            // console.log(sheets);
            // 遍历 sheet
            let sheet = sheets[0].data;
            let tableHeader = sheet[0];

            for (let i = 1; i < sheet.length; i++) {
                let object = {};
                for (let j = 0; j < tableHeader.length; j++) {
                    object[tableHeader[j]] = sheet[i][j];
                }
                this.tableData.push(object);
            }
            // console.log("biaogeshuju", this.tableData);
        },

        current_change: function (currentPage) {
            this.currentPage = currentPage;
        },
    },
};
</script>

<style scoped>
span {
    float: left;
    height: 50px;
    line-height: 40px;
}

.fl {
    width: 300px;
    float: right;
}
/* .fy { 
  text-align: center;
  margin-top: 30px;
} */
</style>
