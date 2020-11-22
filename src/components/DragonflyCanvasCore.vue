<template>
    <div class="dragonfly-canvas"
         :style="{transform:`scale(${scale})`, top:`${offsetY}px`, left:`${offsetX}px`}"
         @mousedown.prevent="clearSelection">
        <div class="ref"></div>
        <dragonfly-node
            v-for="node in nodes.value"
            :key="node.id"
            :node="node"
            :selected="selected[node.id]"
            @select="onNodeSelected"
            @unselect="onNodeUnselected"
            @link:node="linkNode"
        >
            <slot :node="node" name="node">{{ node.id }}</slot>
        </dragonfly-node>
        <dragonfly-canvas-edges-layer
            :positions="positions"
            :linking="isLinking"
            :linking-source="linkingSource"
            :linking-target="linkingTarget">
            <template #default="{target, source}">
                <slot name="edge" :target="target" :source="source"/>
            </template>
            <template #linking="{target, source}">
                <straight-line :target="target" :source="source"/>
            </template>
        </dragonfly-canvas-edges-layer>
    </div>
</template>

<script>
import DragonflyNode from "./DragonflyNode.vue";
import dagreLayout from "../layout/dagreLayout";
import DragonflyCanvasEdgesLayer from "./DragonflyCanvasEdgesLayer.vue";
import {computed} from 'vue'
import StraightLine from "./edge/StraightLine.vue";

export default {
    name: "DragonflyCanvasCore",
    components: {StraightLine, DragonflyCanvasEdgesLayer, DragonflyNode},
    props: ['offsetX', 'offsetY', 'scale', 'layoutConfig'],
    inject: ['nodes', 'edges'],
    data() {
        return {
            nodeSizes: {},
            positions: {},
            selected: {},
            linkingSource: {x: 0, y: 0},
            linkingTarget: {x: 0, y: 0},
            isLinking: false,
        }
    },
    provide() {
        return {
            resize: this.resize,
            moving: this.moving,
            linking: this.linking,
            stopLinking: this.stopLinking,
            positions: computed(() => this.positions),
        }
    },
    computed: {
        layout() {
            return dagreLayout(this.nodes.value, this.nodeSizes, this.edges.value, this.layoutConfig)
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
        linking(sourceX, sourceY, targetX, targetY) {
            if (Object.keys(this.selected).length === 1) {
                this.linkingSource = {x: sourceX, y: sourceY}
                this.linkingTarget = {x: targetX, y: targetY}
                this.isLinking = true
            }
        },
        stopLinking() {
            this.isLinking = false
        },
        linkNode({target, source}) {
            if (!this.edges.value.some(edge => edge.target === target && edge.source === source)) {
                this.$emit('update:edges', [...this.edges.value, {id:`${source}-${target}`, target, source}])
            }
        },
        onNodeSelected({nodeId, multiple}) {
            multiple
                ? (this.selected[nodeId] = true)
                : (this.selected = {[nodeId]: true})
        },
        onNodeUnselected(nodeId) {
            delete this.selected[nodeId]
        },
        clearSelection() {
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
