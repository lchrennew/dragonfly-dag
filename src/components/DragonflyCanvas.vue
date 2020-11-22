<template>
    <div class="dragonfly-viewport"
         @mousedown.prevent="dragging=true"
         @mouseup="dragging=false"
         @mousemove="onMove"
         @wheel.prevent="onZoom">
        <div class="dragonfly-canvas"
             :style="{transform:`scale(${scale})`, top:`${offsetY}px`, left:`${offsetX}px`}"
             @mousedown.prevent="clearSelection">
            <div class="ref"></div>
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :node="node"
                :selected="selected[node.id]"
                @select="onNodeSelected"
                @unselect="onNodeUnselected"
                @link:node="linkNode"
            >
                <slot name="nodeRenderer" :node="node">{{ node.id }}</slot>
            </dragonfly-node>
            <dragonfly-canvas-edges-layer
                :positions="positions"
                :linking="isLinking"
                :linking-source="linkingSource"
                :linking-target="linkingTarget"
                :edges="edges"
            >
                <template #default="{target, source}">
                    <slot name="edgeRenderer" :target="target" :source="source">
                        <straight-line :target="target" :source="source" v-if="source && target"/>
                    </slot>
                </template>
                <template #linking="{target, source}">
                    <straight-line :target="target" :source="source"/>
                </template>
            </dragonfly-canvas-edges-layer>
        </div>
    </div>
</template>

<script>
import DragonflyNode from "./DragonflyNode.vue";
import StraightLine from "./edge/StraightLine.vue";
import {computed} from 'vue'
import dagreLayout from "../layout/dagreLayout";
import DragonflyCanvasEdgesLayer from "./DragonflyCanvasEdgesLayer.vue";

export default {
    name: "DragonflyCanvas",
    components: {StraightLine, DragonflyNode, DragonflyCanvasEdgesLayer},
    data() {
        return {
            dragging: false,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
            nodeSizes: {},
            positions: {},
            selected: {},
            linkingSource: {x: 0, y: 0},
            linkingTarget: {x: 0, y: 0},
            isLinking: false,
        }
    },
    props: {
        nodes: {
            type: Array,
            default: [],
            validate(value) {
                return value.every(node => node.id)
            }
        },
        edges: {
            type: Array,
            default: [],
        },
        zoomSensitivity: {
            type: Number,
            default: 0.001,
        },
        defaultScale: {
            type: Number,
            default: 1,
        },
        maxScale: {
            type: Number,
            default: 5,
        },
        minScale: {
            type: Number,
            default: 0.5,
        },
        layoutConfig: {
            type: Object,
            default: () => ({})
        },
        draggable: {
            type: Boolean,
            default: false,
        },
        linkable: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        layout() {
            return dagreLayout(this.nodes, this.nodeSizes, this.edges, this.layoutConfig)
        },
    },
    methods: {
        onZoom(event) {
            if ((event.deltaY < 0 && this.scale <= this.minScale) || (event.deltaY > 0 && this.scale >= this.maxScale))
                return

            let scale = this.scale + this.zoomSensitivity * event.deltaY
            if (scale > this.maxScale) scale = this.maxScale
            else if (scale < this.minScale) scale = this.minScale

            const delta = scale - this.scale
            this.offsetX += (this.width / 2 - event.clientX + this.offsetX) * delta / this.scale
            this.offsetY += (this.height / 2 - event.clientY + this.offsetY) * delta / this.scale
            this.scale = scale
        },
        onMove(event) {
            if (this.dragging) {
                this.offsetX += event.movementX
                this.offsetY += event.movementY
            }
        },
        nodeResize(nodeId, width, height) {
            this.nodeSizes[nodeId] = {width, height}
        },
        nodeMoving(deltaX, deltaY) {
            for (const nodeId in this.selected) {
                let {x, y} = this.positions[nodeId]
                x += deltaX
                y += deltaY
                this.positions[nodeId] = {x, y}
            }
        },
        nodeLinking(sourceX, sourceY, targetX, targetY) {
            if (Object.keys(this.selected).length === 1) {
                this.linkingSource = {x: sourceX, y: sourceY}
                this.linkingTarget = {x: targetX, y: targetY}
                this.isLinking = true
            }
        },
        stopNodeLinking() {
            this.isLinking = false
        },
        linkNode({target, source}) {
            if (!this.edges.some(edge => edge.target === target && edge.source === source)) {
                this.$emit('update:edges', [...this.edges, {id: `${source}-${target}`, target, source}])
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
    provide() {
        return {
            nodes: computed(() => this.nodes),
            edges: computed(() => this.edges),
            canvasDraggable: computed(() => this.draggable),
            canvasLinkable: computed(() => this.linkable),
            nodeResize: this.nodeResize,
            nodeMoving: this.nodeMoving,
            nodeLinking: this.nodeLinking,
            stopNodeLinking: this.stopNodeLinking,
            positions: computed(() => this.positions),
        }
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        this.positions = this.layout._nodes
    }
}
</script>

<style scoped lang="less">
.dragonfly-viewport {
    overflow: hidden;
    width: 100%;
    height: 100%;

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
}
</style>
