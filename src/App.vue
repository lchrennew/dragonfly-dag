<template>
    <div>
        <a-button @click="addNode">添加节点</a-button>
    </div>
    <div style="width: 800px; height: 100%; margin-left: 100px; margin-top: 100px; border:solid 1px #f00;">
        <dragonfly-canvas
            v-model:nodes="nodes"
            v-model:edges="edges"
            :layout-config="config.layout"
            :linkable="config.linkable"
            :zoomable="config.zoomable"
            :min-zoom-scale="config.minZoomScale"
            :max-zoom-scale="config.maxZoomScale"
            v-model:zoom-scale="config.zoomScale"
            :arrow-zoom-ratio="config.arrowZoomRatio"
            :show-arrow="config.showArrow"
            :mid-arrow="config.midArrow"
            :before-add-edge-hook="onAddingEdge"
            :endpoint-group="{linkIn: false, linkOut: true}"
            :node-group="{linkIn: true, linkOut: false}"
            v-model:canvas-dragging="config.canvasDragging"
            v-model:node-dragging="config.nodeDragging"
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
        v-model:linkable="config.linkable"
        v-model:showArrow="config.showArrow"
        v-model:arrowZoomRatio="config.arrowZoomRatio"
        v-model:midArrow="config.midArrow"
        v-model:zoomable="config.zoomable"
        v-model:zoom-scale="config.zoomScale"
        v-model:min-zoom-scale="config.minZoomScale"
        v-model:max-zoom-scale="config.maxZoomScale"
        v-model:canvas-dragging="config.canvasDragging"
        v-model:node-dragging="config.nodeDragging"
    />
    <canvas-data :nodes="nodes" :edges="edges"/>
</template>

<script>

import DragonflyCanvas from "./components/DragonflyCanvas.vue";
import CanvasConfig from "./CanvasConfig.vue";
import {ref} from 'vue'
import CanvasData from "./CanvasData.vue";
import DragonflyEndpoint from "./components/DragonflyEndpoint.vue";

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
                linkable: ref(false),
                zoomable: ref(false),
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
                midArrow: ref(false),
                canvasDragging: ref('off'),
                nodeDragging: ref('off'),
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
