<template>
    <div class="dragonfly-viewport"
         @mousemove="onMove"
         @mouseup="onViewportMouseUp"
         @mousedown.prevent="onViewportMouseDown"
         @mouseleave="onLeave"
         @mouseenter="onEnter"
         @wheel.prevent="onZoom">
        <div :style="canvasStyle"
             class="dragonfly-canvas"
             ref="canvas"
        >
            <div v-if="selecting"
                 class="selecting"
                 :style="selectingStyle"/>
            <div class="ref"></div>
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :node="node"
                :selected="selectingSelected[node.id] ?? selected[node.id]"
                @select="onNodeSelected"
                @unselect="onNodeUnselected"
                @link:node="linkNode"
            >
                <slot :node="node" name="nodeRenderer">{{ node.id }}</slot>
            </dragonfly-node>
            <dragonfly-canvas-edges-layer
                :edges="edges"
                :linking="linking"
                :linking-source="linkingSource"
                :linking-target="linkingTarget"
                :positions="positions"
            >
                <template #default="{target, source}">
                    <slot :source="source" :target="target" name="edgeRenderer">
                        <straight-line v-if="source && target" :source="source" :target="target"/>
                    </slot>
                </template>
                <template #linking="{target, source}">
                    <straight-line :source="source" :target="target"/>
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

const shiftStrategies = {
    disabled: (selected, selecting) => selecting,
    continue: (selected, selecting) => selected || selecting,
    reverse: (selected, selecting) => selecting ? !selected : selected
}

export default {
    name: "DragonflyCanvas",
    components: {StraightLine, DragonflyNode, DragonflyCanvasEdgesLayer},
    data() {
        return {
            dragging: false,
            selecting: false,
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
            selectingSource: {x: 0, y: 0},
            selectingTarget: {x: 0, y: 0},
            selectingSelected: {},
            linking: false,
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
        },
        movable: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        layout() {
            return dagreLayout(this.nodes, this.nodeSizes, this.edges, this.layoutConfig)
        },
        canvasStyle() {
            return {
                transform: `scale(${this.scale})`,
                top: `${this.offsetY}px`,
                left: `${this.offsetX}px`
            }
        },
        selectingStyle() {
            const width = `${Math.abs(this.selectingSource.x - this.selectingTarget.x)}px`
            const height = `${Math.abs(this.selectingSource.y - this.selectingTarget.y)}px`
            const top = `${Math.min(this.selectingSource.y, this.selectingTarget.y)}px`
            const left = `${Math.min(this.selectingSource.x, this.selectingTarget.x)}px`
            return {width, height, top, left,}
        },
        singleSelected() {
            return Object.keys(this.selected).filter(nodeId => this.selected[nodeId]).length === 1
        }
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
        onViewportMouseDown(event) {
            if (this.movable) {
                this.dragging = true
                this.clearSelection()
            } else {
                if (!event.shiftKey) this.clearSelection()
                this.selecting = true
                const insideCanvas = event.target === this.$refs.canvas
                this.selectingSource.x = this.selectingTarget.x = event.offsetX - (insideCanvas ? 0 : this.offsetX)
                this.selectingSource.y = this.selectingTarget.y = event.offsetY - (insideCanvas ? 0 : this.offsetY)
            }
        },
        onViewportMouseUp() {
            this.dragging = false
            if (this.selecting) {
                this.syncSelectedFromSelectingSelected()
            }
        },
        onMove(event) {
            if (this.dragging) {
                this.offsetX += event.movementX
                this.offsetY += event.movementY
            } else {
                this.onSelecting(event)
            }
        },
        syncSelectingSelected(shiftKey) {
            for (const nodeId in this.positions) {
                const selected = this.selected[nodeId]
                const {x, y} = this.positions[nodeId]
                const xBetween = (x <= this.selectingTarget.x && x >= this.selectingSource.x) || (x >= this.selectingTarget.x && x <= this.selectingSource.x)
                const yBetween = (y <= this.selectingTarget.y && y >= this.selectingSource.y) || (y >= this.selectingTarget.y && y <= this.selectingSource.y)
                const selecting = xBetween && yBetween
                this.selectingSelected[nodeId] = shiftKey ? shiftStrategies.reverse(selected, selecting) : selecting
            }
        },
        syncSelectedFromSelectingSelected() {
            this.selected = {...this.selectingSelected}
            this.selectingSelected = {}
            this.selecting = false
        },
        onSelecting(event) {
            if (this.selecting) {
                this.selectingTarget.x += event.movementX / this.scale
                this.selectingTarget.y += event.movementY / this.scale
                this.syncSelectingSelected(event.shiftKey)
            }
        },
        onMouseUpOutside() {
            document.removeEventListener('mousemove', this.onSelecting)
            document.removeEventListener('mouseup', this.onMouseUpOutside)
            this.syncSelectedFromSelectingSelected()
        },
        onLeave() {
            if (this.selecting) {
                // hacking: 鼠标选择时离开窗口时，继续监听鼠标事件
                document.addEventListener('mousemove', this.onSelecting, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            }
        },
        onEnter() {
            if (this.selecting) {
                // hacking: 鼠标选择时离开窗口后又回到窗口时，消除离开时的额外监听
                document.removeEventListener('mousemove', this.onSelecting)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
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
        },
        // 用于Provide/Inject
        nodeResize(nodeId, width, height) {
            this.nodeSizes[nodeId] = {width, height}
        },
        nodeMoving(deltaX, deltaY) {
            for (const nodeId in this.selected) {
                if (this.selected[nodeId]) {
                    let {x, y} = this.positions[nodeId]
                    x += deltaX
                    y += deltaY
                    this.positions[nodeId] = {x, y}
                }
            }
        },
        nodeLinking(sourceX, sourceY, targetX, targetY) {
            if (this.singleSelected) {
                this.linkingSource = {x: sourceX, y: sourceY}
                this.linkingTarget = {x: targetX, y: targetY}
                this.linking = true
            }
        },
        stopNodeLinking() {
            this.linking = false
        },
        linkNode({target, source}) {
            if (!this.edges.some(edge => edge.target === target && edge.source === source)) {
                this.$emit('update:edges', [...this.edges, {id: `${source}-${target}`, target, source}])
            }
        },
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
        const positions = this.layout._nodes
        for (let {id, x, y} of this.nodes) {
            if (x !== undefined)
                positions[id] = {...positions[id], x}
            if (y !== undefined)
                positions[id] = {...positions[id], y}
        }
        this.positions = positions
    }
}
</script>

<style lang="less" scoped>
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

        .selecting {
            border: none;
            background-color: #80d4ff;
            opacity: 0.3;
            position: absolute;
            z-index: 6;
        }
    }
}
</style>
