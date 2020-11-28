<template>
    <div class="dragonfly-viewport"
         @mousedown="onCanvasDragging"
         @mouseenter="onCanvasDragging"
         @mouseleave="onCanvasDragging"
         @mousemove="onCanvasDragging"
         @mouseup="onCanvasDragging"
         @wheel.prevent="onCanvasWheeling"
    >
        <dragonfly-canvas-tools
            v-model:canvas-dragging-behavior="canvasDraggingBehavior"
            v-model:node-dragging-behavior="nodeDraggingBehavior"
            v-model:canvas-wheeling-behavior="canvasWheelingBehavior"
        />
        <div ref="canvas"
             :style="canvasStyle"
             class="dragonfly-canvas"
             @keydown="onKeyDown"
             tabindex="-1"
        >
            <div v-if="dragging"
                 :style="draggingAreaStyle"
                 :class="canvasDraggingBehavior"
                 class="area"/>
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :group="normalizedNodeGroup(node)"
                :node="node"
                :selected="preSelected[node.id] ?? selected[node.id]"
                @select="onSelect"
                @unselect="onUnselect"
            >
                <template #default>
                    <slot :node="node" name="nodeRenderer">{{ node.id }}</slot>
                </template>
                <template #topEndpoints>
                    <slot :node="node" name="topEndpoints"/>
                </template>
                <template #leftEndpoints>
                    <slot :node="node" name="leftEndpoints"/>
                </template>
                <template #rightEndpoints>
                    <slot :node="node" name="rightEndpoints"/>
                </template>
                <template #bottomEndpoints>
                    <slot :node="node" name="bottomEndpoints"/>
                </template>
            </dragonfly-node>
            <dragonfly-canvas-edges-layer
                :arrow-zoom-ratio="arrowZoomRatio"
                :edges="edges"
                :endpoint-positions="endpointPositions"
                :linking="linking"
                :linking-source="linkingSource"
                :linking-target="linkingTarget"
                :positions="positions"
            />
        </div>
    </div>
</template>

<script>
import './dragonfly-dag.less'

import DragonflyNode from "./DragonflyNode.vue";
import StraightLine from "./edge/StraightLine.vue";
import {computed, ref} from 'vue'
import dagreLayout from "../layout/dagreLayout";
import DragonflyCanvasEdgesLayer from "./DragonflyCanvasEdgesLayer.vue";
import ZigZagLine from "./edge/ZigZagLine.vue";
import DragonflyCanvasTools from "./DragonflyCanvasTools.vue";
import canvasDraggingBehaviorHandlers from "./canvasDraggingBehaviorHandlers";
import shiftStrategies from "./shiftStrategies";
import canvasWheelingBehaviorHandlers from "./canvasWheelingBehaviorHandlers";

let linkSource = ref(null)

export default {
    name: "DragonflyCanvas",
    components: {DragonflyCanvasTools, ZigZagLine, StraightLine, DragonflyNode, DragonflyCanvasEdgesLayer},
    data() {
        return {
            dragging: false,
            scale: this.zoomScale ?? 1,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
            positions: {},
            endpointPositions: {}, // 存锚点相对于节点的位置
            selected: {},
            linkingSource: {x: 0, y: 0},
            linkingTarget: {x: 0, y: 0},
            draggingSource: {x: 0, y: 0},
            draggingTarget: {x: 0, y: 0},
            preSelected: {},
            linking: false,
            nodeDraggingBehavior: this.nodeDragging,
            canvasDraggingBehavior: this.canvasDragging,
            canvasWheelingBehavior: this.canvasWheeling,
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
        zoomScale: {
            type: Number,
        },
        maxZoomScale: {
            type: Number,
            default: 5,
        },
        minZoomScale: {
            type: Number,
            default: 0.5,
        },
        layoutConfig: {
            type: Object,
            default: () => ({})
        },
        showArrow: {type: Boolean, default: true,},
        arrowZoomRatio: {type: Number, default: 1}, // 箭头显示大小的倍率
        arrowPosition: {type: Number, default: 100},
        beforeAddEdgeHook: {type: Function,}, // 连接前调用钩子，返回false可取消，返回对象可替换默认值
        nodeGroup: {type: [String, Object, Function]},
        endpointGroup: {type: [String, Object, Function]},
        canvasDragging: {type: String, default: 'off'},
        nodeDragging: {type: String, default: 'off'},
        canvasWheeling: {type: String, default: 'off'},
        lineShape: {default: StraightLine},
        linkingLineShape: {default: StraightLine},
    },
    computed: {
        canvasStyle() {
            return {
                transform: `scale(${this.scale})`,
                top: `${this.offsetY}px`,
                left: `${this.offsetX}px`
            }
        },
        draggingArea() {
            const width = Math.abs(this.draggingSource.x - this.draggingTarget.x)
            const height = Math.abs(this.draggingSource.y - this.draggingTarget.y)
            const top = Math.min(this.draggingSource.y, this.draggingTarget.y)
            const left = Math.min(this.draggingSource.x, this.draggingTarget.x)
            return {width, height, top, left,}
        },
        draggingAreaStyle() {
            const width = `${this.draggingArea.width}px`
            const height = `${this.draggingArea.height}px`
            const top = `${this.draggingArea.top}px`
            const left = `${this.draggingArea.left}px`
            return {width, height, top, left,}
        },
        multipleSelected() {
            return Object.keys(this.selected).filter(nodeId => this.selected[nodeId]).length > 1
        },
        normalizedNodeGroup() {
            return this.nodeGroup instanceof Function
                ? this.nodeGroup
                : () => this.nodeGroup
        },
        normalizedEndpointGroup() {
            return this.endpointGroup instanceof Function
                ? this.endpointGroup
                : () => this.endpointGroup
        }
    },
    methods: {
        onCanvasWheeling(event) {
            canvasWheelingBehaviorHandlers[this.canvasWheelingBehavior]?.[event.type]?.call?.(this, event)
        },
        onCanvasDragging(event) {
            canvasDraggingBehaviorHandlers[event.type]?.call?.(this, event)
        },
        scrollDragging(event) {
            this.offsetX += event.movementX
            this.offsetY += event.movementY
        },
        selectDragging(event) {
            this.draggingTarget.x += event.movementX / this.scale
            this.draggingTarget.y += event.movementY / this.scale
            this.preSelect(event.shiftKey)
        },
        zoomDragging(event) {
            this.draggingTarget.x += event.movementX / this.scale
            this.draggingTarget.y += event.movementY / this.scale
        },

        selectDraggingEnd(event) {
            this.selected = {...this.preSelected}
            this.preSelected = {}
        },
        zoomDraggingEnd(event) {
            const {width, height, top, left} = this.draggingArea
            let zoomRatio =
                this.width / this.height >= width / height
                    ? this.height / height
                    : this.width / width
            let scale = this.scale * zoomRatio
            if (scale > this.maxZoomScale) scale = this.maxZoomScale
            if (scale < this.minZoomScale) scale = this.minZoomScale

            this.offsetY = -top * scale
            this.offsetX = -left * scale
            this.scale = scale
        },

        resetLayout() {
            const layout = dagreLayout(this.nodes, this.positions, this.edges, this.layoutConfig)
            const positions = layout._nodes
            for (let {id, x, y} of this.nodes) {
                if (x !== undefined)
                    positions[id] = {...positions[id], x}
                if (y !== undefined)
                    positions[id] = {...positions[id], y}
            }
            this.positions = positions
        },

        preSelect(shiftKey) {
            for (const nodeId in this.positions) {
                const selected = this.selected[nodeId]
                const {x, y} = this.positions[nodeId]
                const xBetween = (x <= this.draggingTarget.x && x >= this.draggingSource.x) || (x >= this.draggingTarget.x && x <= this.draggingSource.x)
                const yBetween = (y <= this.draggingTarget.y && y >= this.draggingSource.y) || (y >= this.draggingTarget.y && y <= this.draggingSource.y)
                const selecting = xBetween && yBetween
                this.preSelected[nodeId] = shiftKey ? shiftStrategies.reverse(selected, selecting) : selecting
            }
        },
        onSelect({id, multiple}) {
            multiple
                ? (this.selected[id] = true)
                : (this.selected = {[id]: true})
        },
        onUnselect(id) {
            delete this.selected[id]
        },
        clearSelection() {
            this.selected = {}
        },
        // 用于Provide/Inject
        nodeResize(nodeId, width, height) {
            this.positions[nodeId] = {x: width / 2, y: height / 2, ...this.positions[nodeId], width, height}
        },
        nodeMoving(deltaX, deltaY) {
            for (const nodeId in this.selected) {
                if (this.selected[nodeId]) {
                    let {x, y, width, height, label} = this.positions[nodeId]
                    x += deltaX
                    y += deltaY
                    this.positions[nodeId] = {x, y, width, height, label}
                }
            }
        },
        startNodeLinking({source, sourceEndpoint, sourceGroup}) {
            linkSource.value = {source, sourceEndpoint, sourceGroup}
        },
        nodeLinking(
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            sourceOrientation = 'right',
            targetX,
            targetY,
            targetWidth = 0,
            targetHeight = 0,
            targetOrientation = 'left') {
            if (!this.multipleSelected) {   // hacking: 包含了从endpoint连接的情况
                this.linkingSource = {
                    x: sourceX,
                    y: sourceY,
                    width: sourceWidth,
                    height: sourceHeight,
                    orientation: sourceOrientation
                }
                this.linkingTarget = {
                    x: targetX,
                    y: targetY,
                    width: targetWidth ?? 0,
                    height: targetHeight ?? 0,
                    orientation: targetOrientation
                }
                this.linking = true
            }
        },
        stopNodeLinking() {
            this.linking = false
            linkSource.value = null
        },
        async link(target, targetEndpoint) {
            const {source, sourceEndpoint} = linkSource.value
            if ((sourceEndpoint ?? source) === (targetEndpoint ?? target)) return

            const defaultEdge = {
                id: `${sourceEndpoint ?? source}-${targetEndpoint ?? target}`,
                target,
                source,
                targetEndpoint,
                sourceEndpoint
            }
            const edge =
                await this.beforeAddEdgeHook?.(defaultEdge) ?? defaultEdge

            if (edge) {
                this.$emit('edge:adding', {edge, defaultEdge})
                this.$emit('update:edges', [...this.edges, edge])
                this.$emit('edge:added', {edge, defaultEdge})
            } else {
                this.$emit('edge:adding-cancelled', {edge, defaultEdge})
            }
        },
        endpointReposition(id, x, y, width, height, orientation) {
            this.endpointPositions[id] = {x, y, width, height, orientation}
        },
        onKeyDown(event) {
            if (event.target === this.$refs.canvas && ['Backspace', 'Delete'].includes(event.key)) {
                const nodes = this.nodes.filter(({id}) => !this.selected[id])
                const edges = this.edges.filter(({id, source, target}) => !this.selected[id] && !this.selected[source] && !this.selected[target])
                this.$emit('update:nodes', nodes)
                this.$emit('update:edges', edges)
            }
        }
    },
    provide() {
        return {
            nodes: computed(() => this.nodes),
            edges: computed(() => this.edges),
            nodeResize: this.nodeResize,
            nodeMoving: this.nodeMoving,
            startNodeLinking: this.startNodeLinking,
            nodeLinking: this.nodeLinking,
            stopNodeLinking: this.stopNodeLinking,
            endpointReposition: this.endpointReposition,
            link: this.link,
            positions: computed(() => this.positions),
            arrowPosition: computed(() => this.arrowPosition),
            showArrow: computed(() => this.showArrow),
            linkSource: computed(() => linkSource.value),
            nodeGroup: computed(() => this.normalizedNodeGroup),
            endpointGroup: computed(() => this.normalizedEndpointGroup),
            nodeDraggingBehavior: computed(() => this.nodeDraggingBehavior),
            lineShape: computed(() => this.lineShape),
            linkingLineShape: computed(() => this.linkingLineShape),
            dragging: computed(() => this.dragging),
            onSelect: this.onSelect,
            onUnselect: this.onUnselect,
            selected: computed(() => this.selected)
        }
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        this.resetLayout()
    },
    watch: {
        zoomScale(value) {
            this.scale = value
        },
        scale(value) {
            this.$emit('update:zoomScale', value)
        },
        nodeDragging(value) {
            this.nodeDraggingBehavior = value
        },
        nodeDraggingBehavior(value) {
            this.$emit('update:nodeDragging', value)
        },
        canvasDragging(value) {
            this.canvasDraggingBehavior = value
        },
        canvasDraggingBehavior(value) {
            this.$emit('update:canvasDragging', value)
        },
        canvasWheeling(value) {
            this.canvasWheelingBehavior = value
        },
        canvasWheelingBehavior(value) {
            this.$emit('update:canvasWheeling', value)
        },

    }
}
</script>
