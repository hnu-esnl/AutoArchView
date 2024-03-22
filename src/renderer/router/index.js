import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
import overView from '../components/overView.vue'
// import Graphviz from '@/components/Graphviz.vue'
import LandingPage from '@/components/LandingPage.vue'
export default new Router({
    // mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    mode: 'hash',
    base: process.env.BASE_URL,
    routes: [{
            path: '/',
            name: 'landing-page',
            component: require('../components/LandingPage.vue').default
        },
        {
            path: '*',
            redirect: overView
        }

        // {
        //     path: '/overView',
        //     component: overView
        // },
        // {
        //     path: '/Graphviz',
        //     component: Graphviz
        // }
    ],

})