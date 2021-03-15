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
        v-model:layout="layout"
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
        :node-group="{linkIn: true, linkOut: false}"
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

<script>
import { ref, shallowRef } from 'vue'
import { DotGrid, DragonflyCanvas, DragonflyEndpoint, StraightLine, } from '../build'
import CanvasConfig from './CanvasConfig.vue';
import CanvasData from './CanvasData.vue';
import './components/dragonfly-dag.less'

export default {
  name: 'App',
  components: {
    DragonflyEndpoint,
    CanvasData,
    CanvasConfig,
    DragonflyCanvas
  },
  data() {
    return {
      config: {
        zoomScale: ref(1),
        minZoomScale: ref(0.1),
        maxZoomScale: ref(5),
        zoomSensitivity: ref(0.001),
        layout: {
          rankdir: 'TB',
          marginx: 40,
          marginy: 40,
        },
        showArrow: ref(false),
        arrowZoomRatio: ref(1),
        arrowPosition: ref(100),
        canvasDragging: ref('select'),
        nodeDragging: ref('move'),
        canvasWheeling: ref('zoom'),
        endpointDragging: ref('on'),
        lineShape: shallowRef(StraightLine),
        showEdgeLabels: ref(false),
        gridSize: ref(20),
        maxGridScale: ref(2),
        minGridScale: ref(0.5),
        gridShape: shallowRef(DotGrid)
      },
      feed: 1,
      nodes: [{ id: 's1', status: 'queueing' }, { id: 's2', status: 'queueing' }],
      edges: [{ id: 's1-succeeded-s2', source: 's1', target: 's2' }],
      zones: [],
      layout: {},
    }
  },
  methods: {
    addNode() {
      // DON'T DO THIS
      this.nodes.push({ id: `${this.feed}` })

      // DO THIS
      // this.nodes = [...this.nodes, {id: `${this.feed}`}]
      this.feed++
    },
    addZone() {
      this.zones.push({ id: `${this.feed}` })
      this.feed++
    },
    async onAddingEdge({ source, target, sourceEndpoint, targetEndpoint }) {
      return new Promise(resolve => {
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
    },
    autoLayout() {
      this.$refs.canvas.resetLayout()
    },
    onDblClick(event) {
      const axis = this.$refs.canvas.translateMouseEvent(event)
      if (axis) {
        this.nodes = [...this.nodes, { id: 's3' }]
        this.$nextTick(() => {
          this.layout['s3'] = { ...this.layout['s3'], ...axis }
        })
      }
    }
  }
}
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
