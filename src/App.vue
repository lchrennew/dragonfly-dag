<template>
    <dragonfly-canvas :nodes="nodes" :edges="edges"
                      :layout-config="config.layout"
                      :draggable="config.draggable"
                      :min-scale="0.2"
                      :max-scale="5"
    >
        <template #nodeRenderer="{node}">
            <div class="node">Hi, {{ node.id }}</div>
        </template>
    </dragonfly-canvas>
    <canvas-config v-model:draggable="config.draggable"/>
</template>

<script>

import DragonflyCanvas from "./components/DragonflyCanvas.vue";
import CanvasConfig from "./CanvasConfig.vue";
import {ref} from 'vue'
export default {
    name: 'App',
    components: {
        CanvasConfig,
        DragonflyCanvas
    },
    data() {
        return {
            config: {
                draggable: ref(true),
                linkable: true,
                layout: {
                    rankdir: 'LR',
                    marginx: 20,
                    marginy: 20,
                }
            },

            nodes: [
                {id: '1'},
                {id: '2'},
                {id: '3'},
                {id: '4'},
                {id: '5'},
                {id: '6'},
                {id: '7'},
                {id: '8'},
            ],
            edges: [
                {id: '1-2', source: '1', target: '2'},
                {id: '2-3', source: '2', target: '3'},
                {id: '3-4', source: '3', target: '4'},
                {id: '1-4', source: '1', target: '4'},
                {id: '4-5', source: '4', target: '5'},
                {id: '4-6', source: '4', target: '6'},
                {id: '5-6', source: '5', target: '6'},
                {id: '6-7', source: '6', target: '7'},
                {id: '4-8', source: '4', target: '8'},
                {id: '5-8', source: '5', target: '8'},
                {id: '7-8', source: '7', target: '8'},
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
