<template>
    <div style="width: 100%; height: 100%; margin-left: 100px; margin-top: 100px;">
        <dragonfly-canvas
            v-model:nodes="nodes"
            v-model:edges="edges"
            :layout-config="config.layout"
            :draggable="config.draggable"
            :linkable="config.linkable"
            :movable="config.movable"
            :min-scale="0.2"
            :max-scale="5"
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
                linkable: ref(true),
                movable: ref(false),
                layout: {
                    rankdir: 'LR',
                    marginx: 20,
                    marginy: 20,
                }
            },

            nodes: [
                {id: '1',},
                {id: '2',},
                {id: '3',},
                {id: '4',},
                {id: '5',},
                {id: '6',},
                {id: '7',},
                {id: '8',},
            ],
            edges: [
                {
                    id: '1-succeeded-2',
                    source: '1',
                    target: '2',
                    sourceEndpoint: '1-succeeded',
                },
                {
                    id: '2-succeeded-3',
                    source: '2',
                    target: '3',
                    sourceEndpoint: '2-succeeded',
                },
                {
                    id: '3-succeeded-4',
                    source: '3',
                    target: '4',
                    sourceEndpoint: '3-succeeded',
                },
                {
                    id: '1-failed-4',
                    source: '1',
                    target: '4',
                    sourceEndpoint: '1-succeeded',
                },
                {
                    id: '4-succeeded-5',
                    source: '4',
                    target: '5',
                    sourceEndpoint: '4-succeeded',
                },
                {
                    id: '4-failed-6',
                    source: '4',
                    target: '6',
                    sourceEndpoint: '4-failed',
                },
                {
                    id: '5-succeeded-6',
                    source: '5',
                    target: '6',
                    sourceEndpoint: '5-succeeded',
                },
                {
                    id: '6-succeeded-7',
                    source: '6',
                    target: '7',
                    sourceEndpoint: '6-succeeded',
                },
                {
                    id: '4-succeeded-8',
                    source: '4',
                    target: '8',
                    sourceEndpoint: '4-succeeded',
                },
                {
                    id: '5-failed-8',
                    source: '5',
                    target: '8',
                    sourceEndpoint: '5-failed',
                },
                {
                    id: '7-succeeded-8',
                    source: '7',
                    target: '8',
                    sourceEndpoint: '7-succeeded',
                },
            ],
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
