<template>
    <div ref="bubbleChart" style="width:100%;height:376px"></div>
</template>

<script>
export default {
    data() {},
    methods: {
        getEchartData() {
            const chart = this.$refs.bubbleChart;
            if (chart) {
                const myChart = this.$echarts.init(chart);
                const option = {
                    title: {
                        text: "BubbleTest",
                        subtext: "Circular layout",
                        top: "bottom",
                        left: "right",
                    },
                    tooltip: {},
                    legend: [
                        {
                            data: graph.categories.map(function (a) {
                                return a.name;
                            }),
                        },
                    ],
                    animationDurationUpdate: 1500,
                    animationEasingUpdate: "quinticInOut",
                    series: [
                        {
                            name: "Les Miserables",
                            type: "graph",
                            layout: "circular",
                            circular: {
                                rotateLabel: true,
                            },
                            data: graph.nodes,
                            links: graph.links,
                            categories: graph.categories,
                            roam: true,
                            label: {
                                position: "right",
                                formatter: "{b}",
                            },
                            lineStyle: {
                                color: "source",
                                curveness: 0.3,
                            },
                        },
                    ],
                };
                myChart.setOption(option);
                window.addEventListener("resize", function () {
                    myChart.resize();
                });
            }
            this.$on("hook:destroyed", () => {
                window.removeEventListener("resize", function () {
                    myChart.resize();
                });
            });
        },
    },
    mounted() {
        this.getEchartData();
    },
};
</script>

<style>
</style>
