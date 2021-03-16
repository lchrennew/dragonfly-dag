<template>
  <div class="dragonfly-viewport"
       @mousedown.left="onCanvasDragging"
       @mouseenter="onCanvasDragging"
       @mouseleave="onCanvasDragging"
       @mousemove="onCanvasDragging"
       @mouseup="onCanvasDragging"
       @wheel="onCanvasWheeling"
  >
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
          @select="onSelect"
          @unselect="onUnselect"
          #default="{zone}">
        <slot name="zoneRenderer" :zone="zone"/>
      </dragonfly-zone>
    </div>
    <dragonfly-grid
        v-if="showGrid"
        :size="gridSize"
        :offset-x="offsetX"
        :offset-y="offsetY"
        :min-scale="minGridScale"
        :max-scale="maxGridScale"/>
    <dragonfly-scale
        v-if="showScale"
    />
    <dragonfly-minimap
        v-if="showMinimap"
        :width="width"
        :height="height"
        v-model:offset-x="offsetX"
        v-model:offset-y="offsetY"
        :positions="positions"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import dagreLayout from '../layout/dagreLayout';
import { intersect } from '../utils/intersectHelper';
import canvasDraggingBehaviorHandlers from './canvasDraggingBehaviorHandlers';
import canvasWheelingBehaviorHandlers from './canvasWheelingBehaviorHandlers';
import DragonflyCanvasEdgesLayer from './DragonflyCanvasEdgesLayer.vue';
import DragonflyGrid from './DragonflyGrid.vue';
import DragonflyMinimap from './DragonflyMinimap.vue';
import DragonflyNode from './DragonflyNode.vue';
import DragonflyScale from './DragonflyScale.vue';
import DragonflyZone from './DragonflyZone.vue';
import StraightLine from './edge/StraightLine.vue';
import ZigZagLine from './edge/ZigZagLine.vue';
import DotGrid from './grid/DotGrid.vue';
import historyTraveller from './historyTraveller';
import shiftStrategies from './shiftStrategies';

let linkSource = ref(null)
let canvasId = 0

export default {
  name: 'DragonflyCanvas',
  components: {
    DragonflyScale,
    DragonflyMinimap,
    DragonflyGrid,
    DragonflyZone,
    ZigZagLine,
    StraightLine,
    DragonflyNode,
    DragonflyCanvasEdgesLayer
  },
  emits: [
    'update:edges',
    'edges:adding-cancelled',
    'selected:moved',
    'update:zoomScale',
    'update:nodeDragging',
    'update:canvasDragging',
    'update:canvasWheeling',
    'update:endpointDragging',
    'update:layout',
    'update:nodesData',
    'update:zonesData',
    'nodes:deleted',
    'edges:deleted',
    'zones:deleted',
    'selected:moved',
    'edges:added',
    'nodes:added',
    'updated:zoomScale'
  ],
  data() {
    canvasId++
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
      linkingSource: { x: 0, y: 0 },
      linkingTarget: { x: 0, y: 0 },
      draggingSource: { x: 0, y: 0 },
      draggingTarget: { x: 0, y: 0 },
      preSelected: {},
      linking: false,
      nodeDraggingBehavior: this.nodeDragging,
      canvasDraggingBehavior: this.canvasDragging,
      canvasWheelingBehavior: this.canvasWheeling,
      endpointDraggingBehavior: this.endpointDragging,
      canvasId,
      nodesInZone: {},
      history: [],
      historyHead: 0,
      movingSource: null,
      movingTarget: null,
      zones: [...this.zonesData ?? []],
      nodes: [...this.nodesData ?? []],
      edges: [...this.edgesData ?? []],
    }
  },
  props: {
    nodesData: { type: Array, default: [] },
    edgesData: { type: Array, default: [], },
    zonesData: { type: Array, default: [] },
    layout: { type: Object, default: {} },
    zoomSensitivity: { type: Number, default: 0.001, },
    zoomScale: { type: Number, },
    maxZoomScale: { type: Number, default: 5, },
    minZoomScale: { type: Number, default: 0.5, },
    layoutConfig: { type: Object, default: () => ({}) },
    showArrow: { type: Boolean, default: true, },
    arrowZoomRatio: { type: Number, default: 1 }, // 箭头显示大小的倍率
    arrowPosition: { type: Number, default: 100 },
    beforeAddEdgeHook: { type: Function, }, // 连接前调用钩子，返回false可取消，返回对象可替换默认值
    nodeGroup: { type: [String, Object, Function] },
    endpointGroup: { type: [String, Object, Function] },
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
    showScale: { type: Boolean, defualt: false },
    showGrid: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
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
      return { width, height, top, left, }
    },
    draggingAreaStyle() {
      const width = `${this.draggingArea.width}px`
      const height = `${this.draggingArea.height}px`
      const top = `${this.draggingArea.top}px`
      const left = `${this.draggingArea.left}px`
      return { width, height, top, left, }
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
      this.history.length = this.historyHead
      this.history.push({ type, payload })
      this.historyHead++
      this.$emit(type, payload)
      console.log(`${this.historyHead}. ${type}`)
      console.log(payload)
    },
    undo() {
      if (this.historyHead) {
        this.historyHead--
        const { type, payload } = this.history[this.historyHead]
        historyTraveller[type]?.back?.call?.(this, payload)
        console.log(`undo ${type}`)
        console.log(payload)
      }
    },
    redo() {
      const log = this.history[this.historyHead]
      if (log) {
        const { type, payload } = log
        this.historyHead++
        historyTraveller[type]?.forward?.call?.(this, payload)
        console.log(`redo ${type}`)
        console.log(payload)
      }
    },
    deleteSelectedNodes() {
      const deleted = this.nodes.filter(({ id }) => this.selected[id])
      if (deleted.length) {
        this.log('nodes:deleted', {
          nodes: deleted,
          positions: Object.fromEntries(deleted.map(({ id }) => {
            const position = this.positions[id]
            delete this.positions[id]
            return [id, position]
          })),
          edges: this.edges.filter(({ source, target }) => this.selected[source] || this.selected[target]),
        },)
        this.nodes = this.nodes.filter(({ id }) => !this.selected[id])
        this.edges = this.edges.filter(({ source, target }) => !this.selected[source] && !this.selected[target])
      }
    },
    deleteSelectedEdges() {
      const deleted = this.edges.filter(({ id }) => this.selected[id])
      if (deleted.length) {
        this.log('edges:deleted', deleted)
        this.edges = this.edges.filter(({ id }) => !this.selected[id])
      }
    },
    deleteSelectedZones() {
      const deleted = this.zones.filter(({ id }) => this.selected[id])
      if (deleted.length) {
        this.log('zones:deleted', this.zones.filter(({ id }) => this.selected[id]))
        this.zones = this.zones.filter(({ id }) => !this.selected[id])
      }
    },
    onKeyDown(event) {
      if (this.readOnly) return
      if (event.target === this.$refs.canvas) {
        if (['Backspace', 'Delete'].includes(event.code)) {
          this.deleteSelectedNodes()
          this.deleteSelectedEdges()
          this.deleteSelectedZones()
        } else if (event.ctrlKey && event.code === 'KeyZ') {
          this.undo()
        } else if (event.ctrlKey && event.code === 'KeyY') {
          this.redo()
        }
      }
    },
    translateMouseEvent(event) {
      if (event.target === this.$refs.canvas) {
        return { x: event.layerX / this.scale, y: event.layerY / this.scale }
      } else if (event.target === this.$refs.canvas.parentElement) {
        return { x: (event.layerX - this.offsetX) / this.scale, y: (event.layerY - this.offsetY) / this.scale }
      } else return null
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
      this.selected = { ...this.preSelected }
      this.preSelected = {}
    },
    zoomDraggingEnd(event) {
      const { width, height, top, left } = this.draggingArea
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
      for (let { id } of this.nodes) {
        let { width, height, x, y } = positions[id]
        x -= width / 2
        y -= height / 2
        positions[id] = { x, y, width, height, ...overwrite ? undefined : this.positions[id] }
      }
      this.positions = positions
    },

    preSelect(shiftKey) {
      for (const nodeId in this.positions) {
        const selected = this.selected[nodeId]
        const { x, y, width, height } = this.positions[nodeId]
        const xBetween = x + width > Math.min(this.draggingSource.x, this.draggingTarget.x) && x < Math.max(this.draggingSource.x, this.draggingTarget.x)
        const yBetween = y + height > Math.min(this.draggingSource.y, this.draggingTarget.y) && y < Math.max(this.draggingSource.y, this.draggingTarget.y)
        const selecting = xBetween && yBetween
        this.preSelected[nodeId] = shiftKey ? shiftStrategies.reverse(selected, selecting) : selecting
      }
    },
    onSelect({ id, multiple }) {
      this.$refs.canvas.focus({ preventScroll: true })
      multiple
          ? (this.selected[id] = true)
          : (this.selected = { [id]: true })
    },
    onUnselect(id) {
      delete this.selected[id]
    },
    clearSelection() {
      this.selected = {}
    },
    // 用于Provide/Inject
    setNodeSize(nodeId, width, height) {
      this.positions[nodeId] = { x: 0, y: 0, ...this.positions[nodeId], width, height }
    },
    startNodeMoving() {
      this.startSelectedMoving()
    },
    nodeMoving(deltaX, deltaY) {
      for (const nodeId in this.selected) {
        if (this.selected[nodeId]) {
          let { x, y, width, height, } = this.positions[nodeId]
          x += deltaX
          y += deltaY
          this.positions[nodeId] = { x, y, width, height, }
        }
      }
    },
    stopNodeMoving() {
      this.movingTarget = Object.fromEntries(Object.keys(this.selected).filter(id => this.selected[id]).map(id => [id, this.positions[id]]))
      this.log('selected:moved', { source: this.movingSource, target: this.movingTarget })
      this.movingSource = this.movingTarget = null
    },
    startNodeLinking({ source, sourceEndpoint, sourceGroup }) {
      linkSource.value = { source, sourceEndpoint, sourceGroup }
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
          await this.beforeAddEdgeHook?.(defaultEdge) ?? defaultEdge

      if (edge) {
        this.$emit('update:edges', [...this.edges, edge])
        this.log('edges:added', { edge, defaultEdge })
      } else {
        this.$emit('edges:adding-cancelled', { edge, defaultEdge })
      }
    },
    endpointReposition(id, x, y, width, height, orientation) {
      this.endpointPositions[id] = { x, y, width, height, orientation }
    },
    updatePosition({ id, x, y, width, height }) {
      this.positions[id] = { x, y, width, height }
    },
    startSelectedMoving() {
      const movingSource = Object.fromEntries(
          Object.keys(this.selected)
              .filter(id => this.selected[id])
              .map(id => [id, { ...this.positions[id] }]))
      this.zones.forEach(({ id: zoneId }) => {
        if (movingSource[zoneId]) {
          const position = movingSource[zoneId]
          for (const { id } of this.nodes) {
            if (!movingSource[id] && id !== zoneId) {
              const { x, y, width, height } = this.positions[id]
              const rect1 = [[position?.x ?? 0, position?.y ?? 0], [(position?.x ?? 0) + (position?.width ?? this.minZoneWidth), (position?.y ?? 0) + (position?.height ?? this.minZoneHeight)]]
              const rect2 = [[x, y], [x + width, y + height]]
              const { r2 } = intersect(rect1, rect2)
              const inZone = r2 === 1
              inZone && (movingSource[id] = { x, y, width, height })
            }
          }
        }
      })
      this.movingSource = movingSource
    },
    startZoneMoving() {
      this.startSelectedMoving()
    },
    zoneMoving(deltaX, deltaY) {
      Object.keys(this.movingSource).forEach(id => {
        let { x, y, width, height } = this.positions[id]
        x += deltaX
        y += deltaY
        this.positions[id] = { x, y, width, height }
      })
    },
    stopZoneMoving() {
      this.movingTarget = Object.fromEntries(Object.keys(this.movingSource).map(id => [id, this.positions[id]]))
      this.$emit('selected:moved', { source: this.movingSource, target: this.movingTarget })
      this.movingSource = this.movingTarget = null
    }
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
      startZoneMoving: this.startZoneMoving,
      zoneMoving: this.zoneMoving,
      stopZoneMoving: this.stopZoneMoving,
      gridShape: computed(() => this.gridShape),
      endpointDraggingBehavior: computed(() => this.endpointDraggingBehavior),
      scale: computed(() => this.scale),
      readOnly: computed(() => this.readOnly),
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
    this.resetLayout(this.autoLayout)
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
    endpointDraggingBehavior(value) {
      this.$emit('update:endpointDragging', value)
    },
    endpointDragging(value) {
      this.endpointDraggingBehavior = value
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
    nodesData: {
      deep: true,
      handler(value) {
        const hash = Object.fromEntries(this.nodes.map(({ id }) => [id, true]))
        const added = value.filter(({ id }) => !hash[id])
        added.length && this.log('nodes:added', added)
        this.nodes = [...value]
      }
    },
    nodes: {
      deep: true,
      handler(value, oldValue) {
        if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
          this.$emit('update:nodesData', value)
        }
      }
    },
    zonesData: {
      deep: true,
      handler(value) {
        this.zones = [...value]
      }
    },
    zones: {
      deep: true,
      handler(value, oldValue) {
        if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
          this.$emit('update:zonesData', value)
        }
      }
    },
    edges: {
      deep: true,
      handler(value, oldValue) {
        if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
          this.$emit('update:edgesData', value)
        }
      }
    },
    edgesData: {
      deep: true,
      handler(value) {
        this.edges = [...value]
      }
    }
  }
}
</script>
