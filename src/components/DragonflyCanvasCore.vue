<template>
    <div class="dragonfly-canvas"
         :style="{transform:`scale(${scale})`, top:`${offsetY}px`, left:`${offsetX}px`}">
        <div class="ref"></div>
        <dragonfly-node
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            :position="positions[node.id]">
            <slot :node="node" name="node">{{ node.id }}</slot>
        </dragonfly-node>
        <dragonfly-canvas-edges-layer :positions="positions" #default="{target, source}">
            <slot name="edge" :target="target" :source="source"/>
        </dragonfly-canvas-edges-layer>
    </div>
</template>

<script>
import DragonflyNode from "./DragonflyNode.vue";
import dagreLayout from "../layout/dagreLayout";
import DragonflyCanvasEdgesLayer from "./DragonflyCanvasEdgesLayer.vue";
import {ref} from 'vue'

export default {
    name: "DragonflyCanvasCore",
    components: {DragonflyCanvasEdgesLayer, DragonflyNode},
    props: ['offsetX', 'offsetY', 'scale', 'layoutConfig'],
    inject: ['nodes', 'edges'],
    data() {
        return {
            nodeSizes: {},
            positions: {},
        }
    },
    provide() {
        return {
            resize: this.resize,
            moving: this.moving,
            positions: ref(this.positions),
        }
    },
    computed: {
        layout() {
            return dagreLayout(this.nodes, this.nodeSizes, this.edges, this.layoutConfig)
        },
    },
    methods: {
        resize(nodeId, width, height) {
            this.nodeSizes[nodeId] = {width, height}
        },
        moving(nodeId, x, y) {
            this.positions[nodeId] = {x, y}
        },
    },
    mounted() {
        this.positions = this.layout._nodes
    }
}
</script>

<style scoped lang="less">
.dragonfly-canvas {
    position: relative;
    overflow: visible;
    width: 100%;
    height: 100%;

    .ref {
        display: block;
        width: 4px;
        height: 4px;
        margin-top: -2px;
        margin-bottom: -2px;
        background-color: red;
        position: absolute;
        left: 50%;
        top: 50%;
    }


}
</style>
