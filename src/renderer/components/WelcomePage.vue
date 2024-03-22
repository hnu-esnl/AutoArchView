<template>
    <div
        id="welcome-page"
        :style="{
      padding: '10px',
      overflowX: 'hidden',
      overflowY: 'auto',
      height: propData.height - 42 + 'px',
    }"
    >
        <el-card :style="{ width: '100%' }">
            <div slot="header">
                <h2>Welcome to AutoArchView</h2>
            </div>
            <h3>Upload a File</h3>
            <p>
                click toolbar
                <span style="color: #409eff">upload </span>button to choose a file to upload
                <br />
                <span style="color: #909399">
                【Attention】
                    <ul>
                        <li>Other buttons are only available after a folder has been imported;</li>
                        <li>The table under the path needs to be complete when importing</li>
                    </ul>
                </span>
            </p>
            <el-divider></el-divider>
            <h3>Show Swc's information table</h3>
            <p>
                click
                <span style="color: #409eff">showSwcTable </span>button to display the details of Swcs
                <el-divider></el-divider>
            </p>

            <h3>Show Swc's Interactive graph</h3>
            <p>
                click
                <span style="color: #409eff">showSwcInteract </span>button to check the interactation between one Swc and others
            </p>
            <el-divider></el-divider>
            <h3>Show software architecture </h3>
            <p>
                click
                <span style="color: #409eff">visualization </span>button to open visual configuration panel,
                <span style="color: #67c23a">configure</span> first and then
                <span style="color: #67c23a"> select</span> the data,and finally click OK button
            </p>
            <p>
                <span style="color: #909399">
                    【Attention】
                    <ul>
                        <li>Visualization is only possible after a folder has been imported;</li>
                        <li>Too much data selected in the sequence diagram will occupy a lot of system resources</li>
                    </ul>
                </span>
            </p>
        </el-card>
    </div>
</template>

<script>
export default {
    props: {
        propData: {
            default: function () {
                return {
                    height: 0,
                    folders: [],
                };
            },
        },
        propMethods: Object,
    },
};
</script>

<style>
</style>