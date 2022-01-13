<template>
  <div>
    <a-space>
      <a-button @click="addNode">添加节点</a-button>
      <a-button @click="addZone">添加区域</a-button>
      <a-button @click="autoLayout">自动布局</a-button>
    </a-space>
  </div>
  <span id="debt"></span>
  <div style="width: 800px; height: 600px; margin-left: 100px; margin-top: 100px; border:solid 1px #f00;">
    <dragonfly-canvas
        ref="canvas"
        v-model:canvas-dragging="config.canvasDragging"
        v-model:canvas-wheeling="config.canvasWheeling"
        v-model:edges-data="edges"
        :positions="layout"
        v-model:node-dragging="config.nodeDragging"
        v-model:nodes-data="nodes"
        v-model:zones-data="zones"
        v-model:zoom-scale="config.zoomScale"
        v-model:endpoint-dragging="config.endponitDragging"
        :arrow-position="config.arrowPosition"
        :arrow-zoom-ratio="config.arrowZoomRatio"
        :before-add-edge-hook="onAddingEdge"
        :endpoint-group="{linkIn: false, linkOut: true}"
        :layout-config="config.layout"
        :line-shape="config.lineShape"
        :max-zoom-scale="config.maxZoomScale"
        :min-zoom-scale="config.minZoomScale"
        :node-group="{linkIn: true, linkOut: true}"
        :show-arrow="config.showArrow"
        :show-edge-labels="config.showEdgeLabels"
        :grid-shape="config.gridShape"
        :grid-size="config.gridSize"
        :max-grid-scale="config.maxGridScale"
        :min-grid-scale="config.minGridScale"
        show-grid
        show-minimap
        show-scale
        auto-layout
        @dblclick.stop.prevent="onDblClick"
        @node:selected="onNodeSelected"
    >
      <template #nodeRenderer="{node}">
        <div class="node">Hi, {{ node.id }}</div>
      </template>
      <template #topEndpoints="{node}">
        <dragonfly-endpoint :endpoint="{id:`${node.id}-input`}" :group="{linkIn: true, linkOut: false}"/>
      </template>
      <template #bottomEndpoints="{node}">
        <dragonfly-endpoint :endpoint="{id:`${node.id}-succeeded`}" class="succeeded-endpoint"/>
        <dragonfly-endpoint :endpoint="{id:`${node.id}-failed`}" class="failed-endpoint"/>
      </template>
      <template #edgeLabelRenderer="{edge}">
        <div :class="`edge-label-${edge.label}`">{{ edge.label }}</div>
      </template>
    </dragonfly-canvas>
  </div>
  <canvas-config
      v-model:arrow-position="config.arrowPosition"
      v-model:arrowZoomRatio="config.arrowZoomRatio"
      v-model:canvas-dragging="config.canvasDragging"
      v-model:canvas-wheeling="config.canvasWheeling"
      v-model:max-zoom-scale="config.maxZoomScale"
      v-model:min-zoom-scale="config.minZoomScale"
      v-model:node-dragging="config.nodeDragging"
      v-model:show-arrow="config.showArrow"
      v-model:show-edge-labels="config.showEdgeLabels"
      v-model:zoom-scale="config.zoomScale"
  />
  <canvas-data :edges="edges" :layout="layout" :nodes="nodes" :zones="zones"/>
</template>

<script setup>
import { getCurrentInstance, nextTick, reactive, shallowRef } from "vue";
import { DotGrid, DragonflyCanvas, DragonflyEndpoint, StraightLine, } from '../build'
import CanvasConfig from './CanvasConfig.vue';
import CanvasData from './CanvasData.vue';
import './components/dragonfly-dag.less'

const current = getCurrentInstance()

const config = reactive({
  zoomScale: 1,
  minZoomScale: 0.1,
  maxZoomScale: 5,
  zoomSensitivity: 0.001,
  layout: {
    rankdir: 'TB',
    marginx: 40,
    marginy: 40,
  },
  showArrow: false,
  arrowZoomRatio: 1,
  arrowPosition: 100,
  canvasDragging: 'select',
  nodeDragging: 'move',
  canvasWheeling: 'zoom',
  endpointDragging: 'on',
  lineShape: shallowRef(StraightLine),
  showEdgeLabels: false,
  gridSize: 20,
  maxGridScale: 2,
  minGridScale: 0.5,
  gridShape: shallowRef(DotGrid)
})

const nodes = reactive([ { id: 's1', status: 'queueing' }, { id: 's2', status: 'queueing' } ])
const edges = reactive([ { id: 's1-succeeded-s2', source: 's1', target: 's2' } ])
const zones = reactive([])
const layout = reactive({})

const addNode = () => {
  // DON'T DO THIS
  nodes.push({ id: `${feed}` })

  // DO THIS
  // this.nodes = [...this.nodes, {id: `${feed}`}]
  feed++
}
const addZone = () => {
  zones.push({ id: `${feed}` })
  feed++
}


const onAddingEdge = async ({ source, target, sourceEndpoint, targetEndpoint }) => new Promise(resolve => {
  setTimeout(() => {
    resolve({
      id: `${sourceEndpoint ?? source}-${targetEndpoint ?? target}`,
      source,
      target,
      sourceEndpoint,
      targetEndpoint,
      label: (sourceEndpoint ?? source).split('-')[1]
    }) // 用自定义数据连接
    // resolve(false)   // 取消连接
    // resolve(undefined)  // 用默数据连接
  }, 100)
})

const autoLayout = () => current.refs.canvas.resetLayout()

const onDblClick = event => {
  const axis = current.refs.canvas.translateMouseEvent(event)
  if (axis) {
    nodes.push({ id: 's3' })
    nextTick(() => layout['s3'] = { ...layout['s3'], ...axis })
  }
};

const onNodeSelected = event => {
  console.log(event)
}

</script>

<script>
let feed = 1
</script>
<style lang="less">
.node {
  padding: 1em;
  background-color: #9cdfff;
}

.succeeded-label {
  background-color: #e6ffe6;
  border-radius: 4px;
  color: #bbb;
  line-height: 1em;
  padding: 2px 2px;
  left: 10px;
  top: -15px;
}

.failed-label {
  background-color: #ffe6e6;
  border-radius: 4px;
  color: #bbb;
  line-height: 1em;
  padding: 2px 2px;
  left: 10px;
  top: 5px;
}

.succeeded-endpoint {
  border-color: #7acc7a !important;
}

.failed-endpoint {
  border-color: #cc7a7a !important;
}

.edge-label-succeeded {
  position: relative;
  top: -1em;
  background-color: #7acc7a;
  border-radius: 4px;
  color: #fff;
  line-height: 1em;
  padding: 2px 2px;
}

.edge-label-failed {
  position: relative;
  top: -1em;
  background-color: #cc7a7a;
  border-radius: 4px;
  color: #fff;
  line-height: 1em;
  padding: 2px 2px;
}
</style>
