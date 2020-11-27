<template>
    <div>
        <a-button @click="addNode">添加节点</a-button>
        <a-button @click="autoLayout">自动布局</a-button>
    </div>
    <div style="width: 800px; height: 100%; margin-left: 100px; margin-top: 100px; border:solid 1px #f00;">
        <dragonfly-canvas
            v-model:nodes="nodes"
            v-model:edges="edges"
            :layout-config="config.layout"
            :min-zoom-scale="config.minZoomScale"
            :max-zoom-scale="config.maxZoomScale"
            v-model:zoom-scale="config.zoomScale"
            :arrow-zoom-ratio="config.arrowZoomRatio"
            :show-arrow="config.showArrow"
            :arrow-position="config.arrowPosition"
            :before-add-edge-hook="onAddingEdge"
            :endpoint-group="{linkIn: false, linkOut: true}"
            :node-group="{linkIn: true, linkOut: false}"
            v-model:canvas-dragging="config.canvasDragging"
            v-model:node-dragging="config.nodeDragging"
            v-model:canvas-wheeling="config.canvasWheeling"
            :line-shape="config.lineShape"
            ref="canvas"
        >
            <template #nodeRenderer="{node}">
                <div class="node">Hi, {{ node.id }}</div>
            </template>
            <template #rightEndpoints="{node}">
                <dragonfly-endpoint :endpoint="{id:`${node.id}-succeeded`}"/>
                <dragonfly-endpoint :endpoint="{id:`${node.id}-failed`}"/>
            </template>
        </dragonfly-canvas>
    </div>
    <canvas-config
        v-model:show-arrow="config.showArrow"
        v-model:arrowZoomRatio="config.arrowZoomRatio"
        v-model:arrow-position="config.arrowPosition"
        v-model:zoom-scale="config.zoomScale"
        v-model:min-zoom-scale="config.minZoomScale"
        v-model:max-zoom-scale="config.maxZoomScale"
        v-model:canvas-dragging="config.canvasDragging"
        v-model:node-dragging="config.nodeDragging"
        v-model:canvas-wheeling="config.canvasWheeling"
    />
    <canvas-data :nodes="nodes" :edges="edges"/>
</template>

<script>

import DragonflyCanvas from "./components/DragonflyCanvas.vue";
import CanvasConfig from "./CanvasConfig.vue";
import {ref, shallowRef} from 'vue'
import CanvasData from "./CanvasData.vue";
import DragonflyEndpoint from "./components/DragonflyEndpoint.vue";
import StraightLine from "./components/edge/StraightLine.vue";
import ZigZagLine from "./components/edge/ZigZagLine.vue";

export default {
    name: 'App',
    components: {
        DragonflyEndpoint,
        CanvasData,
        CanvasConfig,
        DragonflyCanvas
    },
    data() {
        return {
            config: {
                zoomScale: ref(1),
                minZoomScale: ref(0.1),
                maxZoomScale: ref(2),
                zoomSensitivity: ref(0.001),
                layout: {
                    rankdir: 'LR',
                    marginx: 20,
                    marginy: 20,
                },
                showArrow: ref(false),
                arrowZoomRatio: ref(1),
                arrowPosition: ref(100),
                canvasDragging: ref('select'),
                nodeDragging: ref('move'),
                canvasWheeling: ref('zoom'),
                lineShape: shallowRef(ZigZagLine),
            },
            feed: 3,
            nodes: [{id: '1'}, {id: '2'}],
            edges: [],
        }
    },
    methods: {
        addNode() {
            this.nodes.push({id: this.feed})
            this.feed++
        },
        async onAddingEdge({source, target, sourceEndpoint, targetEndpoint}) {
            return new Promise(resolve => {
                setTimeout(() => {
                    // resolve({id: 'xxx', source, target, sourceEndpoint, targetEndpoint}) // 用自定义数据连接
                    // resolve(false)   // 取消连接
                    resolve(undefined)  // 用默数据连接
                }, 100)
            })
        },
        autoLayout() {
            this.$refs.canvas.resetLayout()
        }
    }
}
</script>
<style lang="less">
.node {
    padding: 1em;
    background-color: #9cdfff;
}
</style>
