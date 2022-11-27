<script>
let feed = 0
</script>

<script setup>
import { computed, getCurrentInstance, inject, onMounted, provide, reactive, ref } from 'vue'
import dagreLayout from '../layout/dagre-layout.js';
import { intersect } from '../utils/intersect-helper.js';
import getCanvasDraggingHandlers from './canvas-dragging-behavior-handlers.js';
import getCanvasWheelingHandlers from './canvas-wheeling-behavior-handlers.js';
import DragonflyCanvasEdgesLayer from './DragonflyCanvasEdgesLayer.vue';
import DragonflyGrid from './DragonflyGrid.vue';
import DragonflyMinimap from './DragonflyMinimap.vue';
import DragonflyNode from './DragonflyNode.vue';
import DragonflyScale from './DragonflyScale.vue';
import DragonflyZone from './DragonflyZone.vue';
import StraightLine from './edge/StraightLine.vue';
import ZigZagLine from './edge/ZigZagLine.vue';
import DotGrid from './grid/DotGrid.vue';
import shiftStrategies from './shift-strategies.js';

const canvasId = feed++
const linkSource = ref(null);

const current = getCurrentInstance()

const emit = defineEmits([
    'edges:adding-cancelled',
    'selected:moved',
    'update:zoomScale',
    'update:nodeDragging',
    'update:canvasDragging',
    'update:canvasWheeling',
    'update:endpointDragging',
    'update:layout',
    'update:edgesData',
    'update:nodesData',
    'update:zonesData',
    'nodes:deleted',
    'edges:deleted',
    'zones:deleted',
    'selected:moved',
    'edges:added',
    'nodes:added',

    'node:selected',
    'node:unselected',

    'edge:selected',
    'edge:unselected',

    'zone:selected',
    'zone:unselected',

    'canvas:click',
])


// selection start
const selection = reactive([])
const multiple = computed(() => selection.length > 1)


const selected = inject('selected', computed(() => Object.fromEntries(selection.map(id => [ id, true ]))))
const multipleSelected = inject('multipleSelected', multiple)
const selectAgain = inject('selectAgain', (...ids) => {
    selection.length = 0
    selection.push(...ids)
})
const selectMore = inject('selectMore', (...ids) => selection.push(...ids))
const unselect = inject('unselect', (...ids) => {
    const _selection = selection.filter(id => !ids.includes(id))
    selection.length = 0
    selection.push(..._selection)
})

provide('selectAgain', selectAgain)
provide('selectMore', selectMore)
provide('multipleSelected', multipleSelected)
provide('selected', selected)
provide('unselect', unselect)
// selection end


const props = defineProps({
    nodesData: { type: Array, default: () => [] },
    edgesData: { type: Array, default: () => [], },
    zonesData: { type: Array, default: () => [] },
    positions: { type: Object, default: () => reactive({}) },
    zoomSensitivity: { type: Number, default: 0.001, },
    zoomScale: { type: Number, },
    maxZoomScale: { type: Number, default: 5, },
    minZoomScale: { type: Number, default: 0.5, },
    layoutConfig: { type: Object, default: () => ({}) },
    showArrow: { type: Boolean, default: true, },
    arrowZoomRatio: { type: Number, default: 1 }, // 箭头显示大小的倍率
    arrowPosition: { type: Number, default: 100 },
    beforeAddEdgeHook: { type: Function, }, // 连接前调用钩子，返回false可取消，返回对象可替换默认值
    nodeGroup: { type: [ String, Object, Function ] },
    endpointGroup: { type: [ String, Object, Function ] },
    canvasDragging: { type: String, default: 'off' },
    nodeDragging: { type: String, default: 'off' },
    endpointDragging: { type: String, default: 'off' }, // off | node | on
    canvasWheeling: { type: String, default: 'off' },
    lineShape: { default: StraightLine },
    linkingLineShape: { default: StraightLine },
    showEdgeLabels: { type: Boolean, default: true },
    minZoneWidth: { type: Number, default: 120 },
    minZoneHeight: { type: Number, default: 80 },
    gridShape: { default: DotGrid },
    gridSize: { type: Number, default: 10 },
    minGridScale: { type: Number, default: 0.5 },
    maxGridScale: { type: Number, default: 5 },
    autoLayout: { type: Boolean, default: false },
    showMinimap: { type: Boolean, default: false },
    showScale: { type: Boolean, default: false },
    showGrid: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
})

const data = reactive({
    dragging: false,
    scale: props.zoomScale ?? 1,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
    endpointPositions: {}, // 存锚点相对于节点的位置
    linkingSource: { x: 0, y: 0 },
    linkingTarget: { x: 0, y: 0 },
    draggingSource: { x: 0, y: 0 },
    draggingTarget: { x: 0, y: 0 },
    preSelected: {},
    linking: false,
    nodeDraggingBehavior: props.nodeDragging,
    canvasDraggingBehavior: props.canvasDragging,
    canvasWheelingBehavior: props.canvasWheeling,
    endpointDraggingBehavior: props.endpointDragging,
    nodesInZone: {},
    history: [],
    historyHead: 0,
    movingSource: null,
    movingTarget: null,
})

const normalizedEndpointGroup = computed(() =>
    props.endpointGroup instanceof Function
        ? props.endpointGroup
        : () => props.endpointGroup);

const normalizedNodeGroup = computed(() =>
    props.nodeGroup instanceof Function
        ? props.nodeGroup
        : () => props.nodeGroup);

const draggingAreaStyle = computed(() => {
    const width = `${draggingArea.value.width}px`
    const height = `${draggingArea.value.height}px`
    const top = `${draggingArea.value.top}px`
    const left = `${draggingArea.value.left}px`
    return { width, height, top, left, }
});

const draggingArea = computed(() => {
    const width = Math.abs(data.draggingSource.x - data.draggingTarget.x)
    const height = Math.abs(data.draggingSource.y - data.draggingTarget.y)
    const top = Math.min(data.draggingSource.y, data.draggingTarget.y)
    const left = Math.min(data.draggingSource.x, data.draggingTarget.x)
    return { width, height, top, left, }
});

const canvasStyle = computed(() => ({
    transform: `scale(${data.scale})`,
    top: `${data.offsetY}px`,
    left: `${data.offsetX}px`
}));

const nodes = computed({
    get() {
        return props.nodesData ?? []
    },
    set(value) {
        if (JSON.stringify(value) !== JSON.stringify(props.nodesData)) {
            emit('update:nodesData', value)
        }
    }
})
const edges = computed({
    get() {
        return props.edgesData ?? []
    },
    set(value) {
        if (JSON.stringify(value) !== JSON.stringify(props.edgesData)) {
            emit('update:edgesData', value)
        }
    }
})
const zones = computed({
    get() {
        return props.zonesData ?? []
    },
    set(value) {
        if (JSON.stringify(value) !== JSON.stringify(props.zonesData))
            emit('update:zonesData', value)
    }
})
const zoomScale = computed({
    get() {
        return props.zoomScale ?? data.scale
    },
    set(value) {
        data.scale = value
        emit('update:zoomScale', value)
    }
})

const stopZoneMoving = () => {
    data.movingTarget = Object.fromEntries(Object.keys(data.movingSource).map(id => [ id, props.positions[id] ]))
    emit('selected:moved', { source: data.movingSource, target: data.movingTarget })
    data.movingSource = data.movingTarget = null
};

const zoneMoving = (deltaX, deltaY) =>
    Object.keys(data.movingSource).forEach(id => {
        let { x, y, width, height } = props.positions[id]
        x += deltaX
        y += deltaY
        props.positions[id] = { x, y, width, height }
    });

const startSelectedMoving = () => {
    const movingSource = Object.fromEntries(
        Object.keys(selected.value)
            .filter(id => selected.value[id])
            .map(id => [ id, { ...props.positions[id] } ]))
    zones.value.forEach(({ id: zoneId }) => {
        if (movingSource[zoneId]) {
            const position = movingSource[zoneId]
            for (const { id } of nodes.value) {
                if (!movingSource[id] && id !== zoneId) {
                    const { x, y, width, height } = props.positions[id]
                    const rect1 = [ [ position?.x ?? 0, position?.y ?? 0 ], [ (position?.x ?? 0) + (position?.width ?? props.minZoneWidth), (position?.y ?? 0) + (position?.height ?? props.minZoneHeight) ] ]
                    const rect2 = [ [ x, y ], [ x + width, y + height ] ]
                    const { r2 } = intersect(rect1, rect2)
                    const inZone = r2 === 1
                    inZone && (movingSource[id] = { x, y, width, height })
                }
            }
        }
    })
    data.movingSource = movingSource
};

const startZoneMoving = startSelectedMoving;

const updatePosition = ({ id, x, y, width, height }) => props.positions[id] = { x, y, width, height };

const endpointReposition = (id, x, y, width, height, orientation) => data.endpointPositions[id] = {
    x,
    y,
    width,
    height,
    orientation
};

const link = async (target, targetEndpoint) => {
    if (!linkSource.value) return
    const { source, sourceEndpoint } = linkSource.value
    if ((sourceEndpoint ?? source) === (targetEndpoint ?? target)) return

    const defaultEdge = {
        id: `${sourceEndpoint ?? source}-${targetEndpoint ?? target}`,
        target,
        source,
        targetEndpoint,
        sourceEndpoint
    }
    const edge =
        await props.beforeAddEdgeHook?.(defaultEdge) ?? defaultEdge

    if (edge) {
        edges.value = [ ...edges.value, edge ]
    } else {
        emit('edges:adding-cancelled', { edge, defaultEdge })
    }
};

const stopNodeLinking = () => {
    data.linking = false
    linkSource.value = null
};

const nodeLinking = (
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    sourceOrientation = 'right',
    targetX,
    targetY,
    targetWidth = 0,
    targetHeight = 0,
    targetOrientation = 'left') => {
    // if (!multipleSelected.value) {   // hacking: 包含了从endpoint连接的情况
    data.linkingSource = {
        x: sourceX,
        y: sourceY,
        width: sourceWidth,
        height: sourceHeight,
        orientation: sourceOrientation
    }
    data.linkingTarget = {
        x: targetX,
        y: targetY,
        width: targetWidth ?? 0,
        height: targetHeight ?? 0,
        orientation: targetOrientation
    }
    data.linking = true
    // }
};

const startNodeLinking = ({ source, sourceEndpoint, sourceGroup }) => linkSource.value = {
    source,
    sourceEndpoint,
    sourceGroup
};

const stopNodeMoving = () => {
    data.movingTarget = Object.fromEntries(Object.keys(selected.value).filter(id => selected.value[id]).map(id => [ id, props.positions[id] ]))
    data.movingSource = data.movingTarget = null
};

const nodeMoving = (deltaX, deltaY) => {
    for (const nodeId in selected.value)
        if (selected.value[nodeId]) {
            let { x, y, width, height, } = props.positions[nodeId]
            x += deltaX
            y += deltaY
            props.positions[nodeId] = { x, y, width, height, }
        }
};

const startNodeMoving = startSelectedMoving

// 用于Provide/Inject
const setNodeSize = (nodeId, width, height) => props.positions[nodeId] = {
    x: 0,
    y: 0, ...props.positions[nodeId],
    width,
    height
};

const clearSelection = selectAgain

const onUnselect = (id, type = 'node') => {
    unselect(id)
    emit(`${type}:unselected`, id)
};

const onSelect = ({ id, multiple, type = 'node' }) => {
    current.refs.canvas.focus({ preventScroll: true })
    multiple
        ? selectMore(id)
        : selectAgain(id)
    emit(`${type}:selected`, id)
};

const preSelect = shiftKey => {
    for (const nodeId in props.positions) {
        const isSelected = selected.value[nodeId]
        const { x, y, width, height } = props.positions[nodeId]
        const xBetween = x + width > Math.min(data.draggingSource.x, data.draggingTarget.x) && x < Math.max(data.draggingSource.x, data.draggingTarget.x)
        const yBetween = y + height > Math.min(data.draggingSource.y, data.draggingTarget.y) && y < Math.max(data.draggingSource.y, data.draggingTarget.y)
        const selecting = xBetween && yBetween
        data.preSelected[nodeId] = shiftKey ? shiftStrategies.reverse(isSelected, selecting) : selecting
    }
};

const resetLayout = ({ overwrite = true }) => {
    const layout = dagreLayout([ ...nodes.value, ...zones.value ], props.positions, edges.value, props.layoutConfig)
    const positions = layout._nodes
    for (let { id } of nodes.value) {
        let { width, height, x, y } = positions[id]
        x -= width / 2
        y -= height / 2
        props.positions[id] = { x, y, width, height, ...overwrite ? undefined : props.positions[id] }
    }
};

const canvasDraggingBehaviorHandlers = getCanvasDraggingHandlers({
    methods: {
        selectDragging(event) {
            data.draggingTarget.x += event.movementX / zoomScale.value
            data.draggingTarget.y += event.movementY / zoomScale.value
            preSelect(event.shiftKey)
        },
        selectDraggingEnd(event) {
            selectAgain(
                ...Object.entries(data.preSelected)
                    .filter(([ , isSelected ]) => isSelected)
                    .map(([ id ]) => id))
            data.preSelected = {}
        },
        scrollDragging(event) {
            data.offsetX += event.movementX
            data.offsetY += event.movementY
        },
        zoomDragging(event) {
            data.draggingTarget.x += event.movementX / zoomScale.value
            data.draggingTarget.y += event.movementY / zoomScale.value
        },
        zoomDraggingEnd(event) {
            const { width, height, top, left } = draggingArea.value
            let zoomRatio =
                data.width / data.height >= width / height
                    ? data.height / height
                    : data.width / width
            let scale = zoomScale.value * zoomRatio
            if (scale > props.maxZoomScale) scale = props.maxZoomScale
            if (scale < props.minZoomScale) scale = props.minZoomScale

            data.offsetY = -top * scale
            data.offsetX = -left * scale
            zoomScale.value = scale
        },
        clearSelection,
        getCanvas: () => current.refs.canvas,
    },
    computed: { zoomScale },
    data,
    props,
})

const onCanvasDragging = event => {
    canvasDraggingBehaviorHandlers[event.type]?.(event)
};

const canvasWheelingBehaviorHandlers = getCanvasWheelingHandlers({
    data,
    props,
    emit,
    computed: { zoomScale },
    methods: {
        getEl: () => current.refs.el
    },
})

const onCanvasWheeling = event => {
    canvasWheelingBehaviorHandlers[props.canvasWheeling]?.[event.type]?.(event)
};

const translateMouseEvent = ({ event }) => {
    if (event.target === current.refs.canvas) {
        return { x: event.layerX / zoomScale.value, y: event.layerY / zoomScale.value }
    } else if (event.target === current.refs.canvas.parentElement) {
        return {
            x: (event.layerX - data.offsetX) / zoomScale.value,
            y: (event.layerY - data.offsetY) / zoomScale.value
        }
    } else return null
};
defineExpose({ translateMouseEvent })

const onKeyDown = event => {
    if (props.readOnly) return
    if (event.target === current.refs.canvas) {
        if ([ 'Backspace', 'Delete' ].includes(event.code)) {
            deleteSelectedNodes()
            deleteSelectedEdges()
            deleteSelectedZones()
        }
    }
};

const deleteSelectedZones = () => {
    const deleted = zones.value.filter(({ id }) => selected.value[id])
    if (deleted.length) {
        zones.value = zones.value.filter(({ id }) => !selected.value[id])
    }
};

const deleteSelectedEdges = () => {
    const deleted = edges.value.filter(({ id }) => selected.value[id])
    if (deleted.length) {
        edges.value = edges.value.filter(({ id }) => !selected.value[id])
    }
};

const deleteSelectedNodes = () => {
    const deleted = nodes.value.filter(({ id }) => selected.value[id])
    if (deleted.length) {
        nodes.value = nodes.value.filter(({ id }) => !selected.value[id])
        edges.value = edges.value.filter(({ source, target }) => !selected.value[source] && !selected.value[target])
        deleted.forEach(({ id }) => delete props.positions[id])
    }
};

provide('nodes', nodes)
provide('edges', edges)
provide('setNodeSize', setNodeSize)
provide('startNodeMoving', startNodeMoving)
provide('nodeMoving', nodeMoving)
provide('stopNodeMoving', stopNodeMoving)
provide('startNodeLinking', startNodeLinking)
provide('nodeLinking', nodeLinking)
provide('stopNodeLinking', stopNodeLinking)
provide('endpointReposition', endpointReposition)
provide('link', link)
provide('positions', computed(() => props.positions))
provide('arrowPosition', computed(() => props.arrowPosition))
provide('showArrow', computed(() => props.showArrow))
provide('linkSource', linkSource)
provide('nodeGroup', computed(() => props.nodeGroup))
provide('endpointGroup', normalizedEndpointGroup)
provide('nodeDraggingBehavior', computed(() => props.nodeDragging))
provide('lineShape', computed(() => props.lineShape))
provide('linkingLineShape', computed(() => props.linkingLineShape))
provide('dragging', computed(() => data.dragging))
provide('onSelect', onSelect)
provide('onUnselect', onUnselect)
provide('showEdgeLabels', computed(() => props.showEdgeLabels))
provide('canvasId', canvasId)
provide('updatePosition', updatePosition)
provide('minZoneWidth', computed(() => props.minZoneWidth))
provide('minZoneHeight', computed(() => props.minZoneHeight))
provide('startZoneMoving', startZoneMoving)
provide('zoneMoving', zoneMoving)
provide('stopZoneMoving', stopZoneMoving)
provide('gridShape', computed(() => props.gridShape))
provide('endpointDraggingBehavior', computed(() => props.endpointDragging))
provide('scale', zoomScale)
provide('readOnly', computed(() => props.readOnly))


onMounted(() => {
    const el = current.refs.el
    const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            data.width = entry.target.clientWidth
            data.height = entry.target.clientHeight
        })
    })
    data.width = el.clientWidth
    data.height = el.clientHeight
    resizeObserver.observe(el)
    resetLayout({ overwrite: props.autoLayout })
})
</script>

<template>
    <div
        ref="el"
        class="dragonfly-viewport"
        @mouseenter="onCanvasDragging"
        @mouseleave="onCanvasDragging"
        @mousemove="onCanvasDragging"
        @mouseup="onCanvasDragging"
        @wheel="onCanvasWheeling"
        @mousedown.left="onCanvasDragging"
    >
        <div
            :id="`dragonfly-canvas-${canvasId}`"
            ref="canvas"
            :style="canvasStyle"
            class="dragonfly-canvas"
            tabindex="-1"
            @keydown="onKeyDown"
            @click.self="emit('canvas:click')"
        >
            <div v-if="data.dragging"
                 :class="canvasDragging"
                 :style="draggingAreaStyle"
                 class="area"/>
            <dragonfly-node
                v-for="node in nodes"
                :key="node.id"
                :group="normalizedNodeGroup(node)"
                :node="node"
                :selected="data.preSelected[node.id] ?? selected[node.id]"
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
                :endpoint-positions="data.endpointPositions"
                :linking="data.linking"
                :linking-source="data.linkingSource"
                :linking-target="data.linkingTarget"
                :positions="positions">
                <template #label="{edge}">
                    <slot :edge="edge" name="edgeLabelRenderer">{{ edge.label }}</slot>
                </template>
            </dragonfly-canvas-edges-layer>
            <dragonfly-zone
                v-for="zone in zones"
                :key="zone.id"
                #default="{zone}"
                :position="positions[zone.id]"
                :selected="selected[zone.id]"
                :zone="zone"
                @select="onSelect"
                @unselect="onUnselect">
                <slot :zone="zone" name="zoneRenderer"/>
            </dragonfly-zone>
        </div>
        <dragonfly-grid
            v-if="showGrid"
            :max-scale="maxGridScale"
            :min-scale="minGridScale"
            :offset-x="data.offsetX"
            :offset-y="data.offsetY"
            :size="gridSize"/>
        <dragonfly-scale
            v-if="showScale"
        />
        <dragonfly-minimap
            v-if="showMinimap"
            v-model:offset-x="data.offsetX"
            v-model:offset-y="data.offsetY"
            :height="data.height"
            :positions="positions"
            :width="data.width"
        />
        <slot/>
    </div>
</template>
