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
            v-model:canvas-wheeling-behavior="canvasWheelingBehavior"
            v-model:node-dragging-behavior="nodeDraggingBehavior"
        />
        <div :id="`dragonfly-canvas-${canvasId}`"
             ref="canvas"
             :style="canvasStyle"
             class="dragonfly-canvas"
             tabindex="-1"
             @keydown="onKeyDown"
        >
            <div v-if="dragging"
                 :class="canvasDraggingBehavior"
                 :style="draggingAreaStyle"
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
                :positions="positions">
                <template #label="{edge}">
                    <slot :edge="edge" name="edgeLabelRenderer">{{ edge.label }}</slot>
                </template>
            </dragonfly-canvas-edges-layer>
            <dragonfly-zone
                v-for="zone in zones"
                :key="zone.id"
                :selected="selected[zone.id]"
                :zone="zone"
                :position="positions[zone.id]"
                @select="onZoneSelect"
                #default="{zone}">
                <slot name="zoneRenderer" :zone="zone"/>
            </dragonfly-zone>
        </div>
        <dragonfly-grid
            :size="gridSize"
            :offset-x="offsetX"
            :offset-y="offsetY"
            :scale="scale"
            :min-scale="minGridScale"
            :max-scale="maxGridScale"/>
        <dragonfly-scale :scale="scale"/>
        <dragonfly-minimap
            :width="width"
            :height="height"
            v-model:offset-x="offsetX"
            v-model:offset-y="offsetY"
            :scale="scale"
            :positions="positions"
            :history="histroy"
        />
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
import canvasWheelingBehaviorHandlers from "./canvasWheelingBehaviorHandlers";
import DragonflyZone from "./DragonflyZone.vue";
import DragonflyGrid from "./DragonflyGrid.vue";
import DotGrid from "./grid/DotGrid.vue";
import DragonflyMinimap from "./DragonflyMinimap.vue";
import DragonflyScale from "./DragonflyScale.vue";

let linkSource = ref(null)
let canvasId = 0

export default {
    name: "DragonflyCanvas",
    components: {
        DragonflyScale,
        DragonflyMinimap,
        DragonflyGrid,
        DragonflyZone,
        DragonflyCanvasTools,
        ZigZagLine,
        StraightLine,
        DragonflyNode,
        DragonflyCanvasEdgesLayer
    },
    data() {
        return {
            dragging: false,
            scale: this.zoomScale ?? 1,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
            positions: this.layout ?? {},
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
            canvasId: canvasId++,
            nodesInZone: {},
            histroy: [],

            movingSource: null,
            movingTarget: null,
        }
    },
    props: {
        nodes: {type: Array, default: []},
        edges: {type: Array, default: [],},
        zones: {type: Array, default: []},
        layout: {type: Object, default: {}},
        zoomSensitivity: {type: Number, default: 0.001,},
        zoomScale: {type: Number,},
        maxZoomScale: {type: Number, default: 5,},
        minZoomScale: {type: Number, default: 0.5,},
        layoutConfig: {type: Object, default: () => ({})},
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
        showEdgeLabels: {type: Boolean, default: true},
        minZoneWidth: {type: Number, default: 120},
        minZoneHeight: {type: Number, default: 80},
        gridShape: {default: DotGrid},
        gridSize: {type: Number, default: 10},
        minGridScale: {type: Number, default: 0.5},
        maxGridScale: {type: Number, default: 5},
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
        log(type, payload) {
            this.$emit(type, payload)
            this.$nextTick(() => this.histroy.push(type, payload))
        },
        deleteSelectedNodes() {
            const deleted = this.nodes.filter(({id}) => this.selected[id])
            if (deleted.length) {
                this.log('nodes:deleted', {
                    nodes: deleted,
                    positions: Object.fromEntries(deleted.map(({id}) => {
                        const position = this.positions[id]
                        delete this.positions[id]
                        return [id, position]
                    })),
                    edges: this.edges.filter(({source, target}) => this.selected[source] || this.selected[target]),
                })
                this.$emit('update:nodes', this.nodes.filter(({id}) => !this.selected[id]))
            }
        },
        deleteSelectedEdges() {
            const deleted = this.edges.filter(({id}) => this.selected[id])
            if (deleted.length) {
                this.log('edges:deleted', deleted)
            }
            this.$emit('update:edges',
                this.edges.filter(
                    ({id, source, target}) =>
                        !this.selected[id] && !this.selected[source] && !this.selected[target]))
        },
        deleteSelectedZones() {
            const deleted = this.zones.filter(({id}) => this.selected[id])
            if (deleted.length) {
                this.log('zones:deleted', this.zones.filter(({id}) => this.selected[id]))
                this.$emit('update:zones', this.zones.filter(({id}) => !this.selected[id]))
            }
        },
        onKeyDown(event) {
            if (event.target === this.$refs.canvas
                && ['Backspace', 'Delete'].includes(event.key)) {
                this.deleteSelectedNodes()
                this.deleteSelectedEdges()
                this.deleteSelectedZones()
            }
        },
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

        resetLayout(overwrite = true) {
            const layout = dagreLayout([...this.nodes, ...this.zones], this.positions, this.edges, this.layoutConfig)
            const positions = layout._nodes
            for (let {id} of this.nodes) {
                let {width, height, x, y} = positions[id]
                x -= width / 2
                y -= height / 2
                positions[id] = {x, y, width, height, ...overwrite ? undefined : this.positions[id]}
            }
            this.positions = positions
        },

        preSelect(shiftKey) {
            for (const nodeId in this.positions) {
                const selected = this.selected[nodeId]
                const {x, y, width, height} = this.positions[nodeId]
                const xBetween = x + width > Math.min(this.draggingSource.x, this.draggingTarget.x) && x < Math.max(this.draggingSource.x, this.draggingTarget.x)
                const yBetween = y + height > Math.min(this.draggingSource.y, this.draggingTarget.y) && y < Math.max(this.draggingSource.y, this.draggingTarget.y)
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
        setNodeSize(nodeId, width, height) {
            this.positions[nodeId] = {x: 0, y: 0, ...this.positions[nodeId], width, height}
        },
        startNodeMoving() {
            this.movingSource = Object.fromEntries(Object.keys(this.selected).filter(id => this.selected[id]).map(id => [id, this.positions[id]]))
        },
        nodeMoving(deltaX, deltaY) {
            for (const nodeId in this.selected) {
                if (this.selected[nodeId]) {
                    let {x, y, width, height,} = this.positions[nodeId]
                    x += deltaX
                    y += deltaY
                    this.positions[nodeId] = {x, y, width, height,}
                }
            }
        },
        stopNodeMoving() {
            this.movingTarget = Object.fromEntries(Object.keys(this.selected).filter(id => this.selected[id]).map(id => [id, this.positions[id]]))
            this.log('nodes:moved', {source: this.movingSource, target: this.movingTarget})
            this.movingSource = this.movingTarget = null
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
            if (!linkSource.value) return
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
                this.$emit('update:edges', [...this.edges, edge])
                this.log('edges:added', {edge, defaultEdge})
            } else {
                this.$emit('edges:adding-cancelled', {edge, defaultEdge})
            }
        },
        endpointReposition(id, x, y, width, height, orientation) {
            this.endpointPositions[id] = {x, y, width, height, orientation}
        },
        updatePosition({id, x, y, width, height}) {
            this.positions[id] = {x, y, width, height}
        },
        onZoneSelect(zone) {
            this.onSelect(zone)
            const position = this.positions[zone.id]
            for (const id in this.positions) {
                if (id !== zone.id) {
                    const {x, y, width, height} = this.positions[id]
                    const sourceX = position?.x ?? 0, sourceY = position?.y ?? 0,
                        targetX = sourceX + (position?.width ?? this.minZoneWidth),
                        targetY = sourceY + (position?.height ?? this.minZoneHeight)
                    const xBetween = x <= Math.max(targetX, sourceX) && x + width >= Math.min(targetX, sourceX)
                    const yBetween = y <= Math.max(targetY, sourceY) && y + width >= Math.min(targetY, sourceY)
                    this.nodesInZone[id] = xBetween && yBetween
                }
            }
        },
        zoneMoving(deltaX, deltaY) {
            for (const nodeId in this.nodesInZone) {
                if (this.nodesInZone[nodeId]) {
                    let {x, y, width, height} = this.positions[nodeId]
                    x += deltaX
                    y += deltaY
                    this.positions[nodeId] = {x, y, width, height}
                }
            }
        },
    },
    provide() {
        return {
            nodes: computed(() => this.nodes),
            edges: computed(() => this.edges),
            setNodeSize: this.setNodeSize,
            startNodeMoving: this.startNodeMoving,
            nodeMoving: this.nodeMoving,
            stopNodeMoving: this.stopNodeMoving,
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
            selected: computed(() => this.selected),
            showEdgeLabels: computed(() => this.showEdgeLabels),
            canvasId: this.canvasId,
            updatePosition: this.updatePosition,
            minZoneWidth: computed(() => this.minZoneWidth),
            minZoneHeight: computed(() => this.minZoneHeight),
            zoneMoving: this.zoneMoving,
            gridShape: computed(() => this.gridShape),
        }
    },
    mounted() {
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                this.width = entry.target.clientWidth
                this.height = entry.target.clientHeight
            })
        })
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        resizeObserver.observe(this.$el)
        this.resetLayout(false)
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
        layout(value) {
            this.positions = value
        },
        positions: {
            deep: true,
            handler(value) {
                this.$emit('update:layout', value)
            }
        },
        nodes: {
            deep: true,
            handler(value, oldValue) {
                if (value.length > oldValue.length) {
                    this.log('nodes:added', value.filter(node => !oldValue.some(old => old.id === node.id)))
                }
            }
        }
    }
}
</script>
