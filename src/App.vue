<template>
    <div>
        <a-button @click="addNode">添加节点</a-button>
    </div>
    <div style="width: 100%; height: 100%; margin-left: 100px; margin-top: 100px; border:solid 1px #f00;">
        <dragonfly-canvas
            v-model:nodes="nodes"
            v-model:edges="edges"
            :layout-config="config.layout"
            :draggable="config.draggable"
            :linkable="config.linkable"
            :movable="config.movable"
            :min-scale="0.2"
            :max-scale="5"
            :arrow-zoom-ratio="config.arrowZoomRatio"
            :show-arrow="config.showArrow"
            :mid-arrow="config.midArrow"
        >
            <template #nodeRenderer="{node}">
                <div class="node">Hi, {{ node.id }}</div>
            </template>
            <template #rightEndpoints="{node}">
                <dragonfly-endpoint :id="`${node.id}-succeeded`"/>
                <dragonfly-endpoint :id="`${node.id}-failed`"/>
            </template>
        </dragonfly-canvas>
    </div>
    <canvas-config
        v-model:draggable="config.draggable"
        v-model:linkable="config.linkable"
        v-model:movable="config.movable"
        v-model:showArrow="config.showArrow"
        v-model:arrowZoomRatio="config.arrowZoomRatio"
        v-model:midArrow="config.midArrow"
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
                draggable: ref(false),
                linkable: ref(false),
                movable: ref(false),
                layout: {
                    rankdir: 'LR',
                    marginx: 20,
                    marginy: 20,
                },
                showArrow: ref(false),
                arrowZoomRatio: ref(1),
                midArrow: ref(false),
            },
            feed: 3,
            nodes: [{id:'1'},{id:'2'}],
            edges: [],
        }
    },
    methods: {
        addNode() {
            this.nodes.push({id: this.feed})
            this.feed++
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
