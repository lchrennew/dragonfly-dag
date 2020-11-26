<template>
    <div class="dragonfly-viewport"
         @mousedown="onCanvasDragging"
         @mouseenter="onCanvasDragging"
         @mouseleave="onCanvasDragging"
         @mousemove="onCanvasDragging"
         @mouseup="onCanvasDragging"
         @wheel.prevent="onZoom">
        <dragonfly-canvas-tools
            v-model:canvas-dragging-behavior="canvasDraggingBehavior"
            v-model:node-dragging-behavior="nodeDraggingBehavior"
        />
        <div ref="canvas"
             :style="canvasStyle"
             class="dragonfly-canvas"
        >
            <div v-if="draggingCanvas"
                 :style="selectingStyle"
                 class="selecting"/>
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :group="normalizedNodeGroup(node)"
                :node="node"
                :selected="selectingSelected[node.id] ?? selected[node.id]"
                @select="onNodeSelected"
                @unselect="onNodeUnselected"
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
                :show-arrow="showArrow"
            >
                <template #default="{target, source}">
                    <slot :source="source" :target="target" name="edgeRenderer">
                        <straight-line v-if="source && target"
                                       :source="source"
                                       :target="target"
                        />
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
import {computed, ref} from 'vue'
import dagreLayout from "../layout/dagreLayout";
import DragonflyCanvasEdgesLayer from "./DragonflyCanvasEdgesLayer.vue";
import ZigZagLine from "./edge/ZigZagLine.vue";
import DragonflyCanvasTools from "./DragonflyCanvasTools.vue";
import canvasDraggingBehaviorHandlers from "./canvasDraggingBehaviorHandlers";
import shiftStrategies from "./shiftStrategies";

let linkSource = ref({})

export default {
    name: "DragonflyCanvas",
    components: {DragonflyCanvasTools, ZigZagLine, StraightLine, DragonflyNode, DragonflyCanvasEdgesLayer},
    data() {
        return {
            draggingCanvas: false,
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
            selectingSource: {x: 0, y: 0},
            selectingTarget: {x: 0, y: 0},
            selectingSelected: {},
            linking: false,
            nodeDraggingBehavior: this.nodeDragging,
            canvasDraggingBehavior: this.canvasDragging,
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
        zoomable: {
            type: Boolean,
            default: false,
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
        midArrow: {type: Boolean, default: false},
        beforeAddEdgeHook: {type: Function,}, // 连接前调用钩子，返回false可取消，返回对象可替换默认值
        nodeGroup: {type: [String, Object, Function]},
        endpointGroup: {type: [String, Object, Function]},
        canvasDragging: {type: String, default: 'off'},
        nodeDragging: {type: String, default: 'off'},
    },
    computed: {
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
        generateLayout() {
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
        onZoom(event) {
            if (this.zoomable) {
                if ((event.deltaY < 0 && this.scale <= this.minZoomScale) || (event.deltaY > 0 && this.scale >= this.maxZoomScale))
                    return

                let scale = this.scale + this.zoomSensitivity * event.deltaY
                if (scale > this.maxZoomScale) scale = this.maxZoomScale
                else if (scale < this.minZoomScale) scale = this.minZoomScale

                const delta = scale - this.scale
                const rect = this.$el.getBoundingClientRect()
                this.offsetX += (this.offsetX + rect.left - event.clientX) * delta / this.scale
                this.offsetY += (this.offsetY + rect.top - event.clientY) * delta / this.scale
                this.scale = scale
                this.$emit('updated:zoomScale', scale)
            }
        },
        onCanvasDragging(event) {
            (canvasDraggingBehaviorHandlers[this.canvasDraggingBehavior]
                ?? canvasDraggingBehaviorHandlers.default)?.[event.type]?.call?.(this, event)
        },
        onMove(event) {
            if (this.draggingCanvas) {
                event.preventDefault()  // hacking: 避免移动时选择外部文本
                this.offsetX += event.movementX
                this.offsetY += event.movementY
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
            this.draggingCanvas = false
        },
        onSelecting(event) {
            if (this.draggingCanvas) {
                event.preventDefault()  // hacking: 避免移动时选择外部文本
                this.selectingTarget.x += event.movementX / this.scale
                this.selectingTarget.y += event.movementY / this.scale
                this.syncSelectingSelected(event.shiftKey)
            }
        },
        onMouseUpOutside() {
            canvasDraggingBehaviorHandlers[this.canvasDraggingBehavior]?.mouseupOutside?.call?.(this)
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
            linkSource.value = {}
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
            midArrow: computed(() => this.midArrow),
            linkSource: computed(() => linkSource.value),
            nodeGroup: computed(() => this.normalizedNodeGroup),
            endpointGroup: computed(() => this.normalizedEndpointGroup),
            nodeDraggingBehavior: computed(() => this.nodeDraggingBehavior),
        }
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        this.generateLayout()
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
        nodeDraggingBehavior(value){
            this.$emit('update:nodeDragging', value)
        },
        canvasDragging(value){
            this.canvasDraggingBehavior = value
        },
        canvasDraggingBehavior(value){
            this.$emit('update:canvasDragging', value)
        }

    }
}
</script>

<style lang="less" scoped>
.dragonfly-viewport {
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;

    .dragonfly-canvas {
        position: relative;
        overflow: visible;
        width: 100%;
        height: 100%;
        transform-origin: 0 0 0; // 左上角缩放

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
