<template>
    <div class="dragonfly-viewport"
         @mousemove="onMouseMove"
         @mouseup="onViewportMouseUp"
         @mousedown="onViewportMouseDown"
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
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :node="node"
                :selected="selectingSelected[node.id] ?? selected[node.id]"
                @select="onNodeSelected"
                @unselect="onNodeUnselected"
                :group="normalizedNodeGroup(node)"
            >
                <template #default>
                    <slot :node="node" name="nodeRenderer">{{ node.id }}</slot>
                </template>
                <template #topEndpoints>
                    <slot name="topEndpoints" :node="node"/>
                </template>
                <template #leftEndpoints>
                    <slot name="leftEndpoints" :node="node"/>
                </template>
                <template #rightEndpoints>
                    <slot name="rightEndpoints" :node="node"/>
                </template>
                <template #bottomEndpoints>
                    <slot name="bottomEndpoints" :node="node"/>
                </template>
            </dragonfly-node>
            <dragonfly-canvas-edges-layer
                :edges="edges"
                :linking="linking"
                :linking-source="linkingSource"
                :linking-target="linkingTarget"
                :positions="positions"
                :endpoint-positions="endpointPositions"
                :show-arrow="showArrow"
                :arrow-zoom-ratio="arrowZoomRatio"
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

const shiftStrategies = {
    disabled: (selected, selecting) => selecting,
    continue: (selected, selecting) => selected || selecting,
    reverse: (selected, selecting) => selecting ? !selected : selected
}

let linkSource = ref({})

export default {
    name: "DragonflyCanvas",
    components: {ZigZagLine, StraightLine, DragonflyNode, DragonflyCanvasEdgesLayer},
    data() {
        return {
            dragging: false,
            selecting: false,
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
        showArrow: {type: Boolean, default: true,},
        arrowZoomRatio: {type: Number, default: 1}, // 箭头显示大小的倍率
        midArrow: {type: Boolean, default: false},
        beforeAddEdgeHook: {type: Function,}, // 连接前调用钩子，返回false可取消，返回对象可替换默认值
        nodeGroup: {type: [String, Object, Function]},
        endpointGroup: {type: [String, Object, Function]},
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
                this.offsetX += (this.width / 2 - event.clientX + this.offsetX + rect.left) * delta / this.scale
                this.offsetY += (this.height / 2 - event.clientY + this.offsetY + rect.top) * delta / this.scale
                this.scale = scale
                this.$emit('updated:zoomScale', scale)
            }
        },
        onViewportMouseDown(event) {
            if (this.movable) {
                this.dragging = true
                this.clearSelection()
            } else {
                const fromCanvas = event.target === this.$refs.canvas
                const insideCanvas = !fromCanvas && event.path.includes(this.$refs.canvas)
                if (!insideCanvas) {
                    event.preventDefault()
                    if (!event.shiftKey) this.clearSelection()
                    this.selecting = true
                    // hacking: 如果在canvas内开始选择，就不再需要去掉canvas相对于viewport的偏移
                    this.selectingSource.x = this.selectingTarget.x = event.offsetX - (fromCanvas ? 0 : this.offsetX)
                    this.selectingSource.y = this.selectingTarget.y = event.offsetY - (fromCanvas ? 0 : this.offsetY)
                }
            }
        },
        onViewportMouseUp(event) {
            this.dragging = false
            if (this.selecting) {
                this.syncSelectedFromSelectingSelected()
            }
        },
        onMouseMove(event) {
            this.onMove(event)
            this.onSelecting(event)
        },
        onMove(event) {
            if (this.dragging) {
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
            this.selecting = false
        },
        onSelecting(event) {
            if (this.selecting) {
                event.preventDefault()  // hacking: 避免移动时选择外部文本
                this.selectingTarget.x += event.movementX / this.scale
                this.selectingTarget.y += event.movementY / this.scale
                this.syncSelectingSelected(event.shiftKey)
            }
        },
        onMouseUpOutside() {
            if (this.dragging) {
                document.removeEventListener('mousemove', this.onMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
                this.dragging = false
            } else if (this.selecting) {
                document.removeEventListener('mousemove', this.onSelecting)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
                this.syncSelectedFromSelectingSelected()
            }

        },
        onLeave() {
            // hacking: 鼠标选择时离开窗口时，继续监听鼠标事件
            if (this.dragging) {
                document.addEventListener('mousemove', this.onMove, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            } else if (this.selecting) {
                document.addEventListener('mousemove', this.onSelecting, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            }
        },
        onEnter() {
            // hacking: 鼠标选择时离开窗口后又回到窗口时，消除离开时的额外监听
            if (this.dragging) {
                document.removeEventListener('mousemove', this.onMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
            } else if (this.selecting) {
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
            canvasDraggable: computed(() => this.draggable),
            canvasLinkable: computed(() => this.linkable),
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
        }
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
