import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import ViewUI from 'view-design'
import 'view-design/dist/styles/iview.css'
import "./libs/sequence-diagram-min.js";

import echarts from "echarts";
Vue.prototype.$echarts = echarts

// import './libs/webfont.js'

// import VXETable from 'vxe-table'
// import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(ViewUI)
    // Vue.use(VXETable)
    // VXETable.use(VXETablePluginExportXLSX)
    /* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')