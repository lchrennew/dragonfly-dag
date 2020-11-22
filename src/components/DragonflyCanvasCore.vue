<template>
    <div class="dragonfly-canvas"
         :style="{transform:`scale(${scale})`, top:`${offsetY}px`, left:`${offsetX}px`}"
         @mousedown.stop.prevent="clearSelection">
        <div class="ref"></div>
        <dragonfly-node
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            :selected="selected[node.id]"
            @select="onNodeSelected"
            @unselect="onNodeUnselected"
        >
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
import {computed} from 'vue'

export default {
    name: "DragonflyCanvasCore",
    components: {DragonflyCanvasEdgesLayer, DragonflyNode},
    props: ['offsetX', 'offsetY', 'scale', 'layoutConfig'],
    inject: ['nodes', 'edges'],
    data() {
        return {
            nodeSizes: {},
            positions: {},
            selected: {},
        }
    },
    provide() {
        return {
            resize: this.resize,
            moving: this.moving,
            positions: computed(() => this.positions),
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
        moving(deltaX, deltaY) {
            for (const nodeId in this.selected) {
                let {x, y} = this.positions[nodeId]
                x += deltaX
                y += deltaY
                this.positions[nodeId] = {x, y}
            }
        },
        onNodeSelected({nodeId, multiple}) {
            console.log(`selected node #${nodeId}`)
            if (multiple)
                this.selected[nodeId] = true
            else
                this.selected = {[nodeId]: true}
        },
        onNodeUnselected(nodeId) {
            delete this.selected[nodeId]
        },
        clearSelection() {
            console.log('selected clear')
            this.selected = {}
        }
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
