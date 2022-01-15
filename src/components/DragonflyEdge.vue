<template>
  <component
      :is="lineShape"
      v-model:definition="data.definition"
      :position="{source, target}"
  />
  <path
      ref="path"
      :class="{selected}"
      :d="data.definition"
      :marker-end="selected?'url(#anchor)':''"
      :marker-start="selected?'url(#anchor)':''"
      class="edge"
  />
  <template v-if="!readOnly">
    <path
        :d="data.definition"
        class="edge-area"
        @mousedown.left.prevent.stop="onMouseDown"
    />
  </template>
  <line v-if="showArrow"
        :x1="data.arrowPoint1.x"
        :x2="data.arrowPoint2.x"
        :y1="data.arrowPoint1.y"
        :y2="data.arrowPoint2.y"
        class="edge-arrow"
        marker-end="url(#arrow)"
  />
  <template v-if="edge.animate">
    <circle r="2" fill="blue">
      <animateMotion dur="1s"
                     repeatCount="indefinite"
                     :path="data.definition"/>
    </circle>
    <circle r="2" fill="blue">
      <animateMotion
          begin="0.5s"
          dur="1s"
          repeatCount="indefinite"
          :path="data.definition"/>
    </circle>
  </template>

  <foreignObject v-if="showLabel">
    <teleport :to="`#dragonfly-canvas-${canvasId}`">
      <div
          :style="data.labelStyle"
          class="edge-label"
      >
        <slot>{{ edge.label }}</slot>
      </div>
    </teleport>
  </foreignObject>
</template>
<script setup>
import { computed, getCurrentInstance, inject, nextTick, onMounted, reactive, watch } from "vue";

const origin = { x: 0, y: 0 }
const props = defineProps([ 'edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'lineShape', 'selected' ])
const showArrow = inject('showArrow')
const arrowPosition = inject('arrowPosition')
const onSelect = inject('onSelect')
const onUnselect = inject('onUnselect')
const canvasId = inject('canvasId')
const showEdgeLabels = inject('showEdgeLabels')
const readOnly = inject('readOnly')

const data = reactive({
  definition: '',
  arrowPoint1: { x: 0, y: 0 },
  arrowPoint2: { x: 0, y: 0 },
  labelStyle: null
})


const showLabel = computed(() => showEdgeLabels.value && (props.edge.showLabel ?? true) && props.edge.label);

const arrowPositionPercent = computed(() => arrowPosition.value / 100);

const lineEnds = computed(() => ({ source: source.value, target: target.value }));

const target = computed(() => {
  if (props.targetEndpoint) {
    return {
      x: props.targetNode.x + props.targetEndpoint.x,
      y: props.targetNode.y + props.targetEndpoint.y,
      width: props.targetEndpoint.width,
      height: props.targetEndpoint.height,
      orientation: props.targetEndpoint.orientation,
    }
  } else {
    return {
      x: props.targetNode.x,
      y: props.targetNode.y,
      width: props.targetNode.width,
      height: props.targetNode.height,
      orientation: props.targetNode.orientation,
    }
  }
});

const source = computed(() => {
  if (props.sourceEndpoint) {
    return {
      x: props.sourceNode.x + props.sourceEndpoint.x,
      y: props.sourceNode.y + props.sourceEndpoint.y,
      width: props.sourceEndpoint.width,
      height: props.sourceEndpoint.height,
      orientation: props.sourceEndpoint.orientation,
    }
  } else {
    return {
      x: props.sourceNode.x,
      y: props.sourceNode.y,
      width: props.sourceNode.width,
      height: props.sourceNode.height,
      orientation: props.sourceNode.orientation,
    }
  }
});


const onMouseDown = event => {
  if (props.selected) {
    onUnselect(props.edge.id, 'edge')
  } else {
    onSelect({ id: props.edge.id, multiple: event.shiftKey, type: 'edge' })
  }
};

const current = getCurrentInstance()

const generatePoints = () => {
  const path = current.refs.path

  if (path) {
    nextTick(() => {
      const pathLength = path.getTotalLength() ?? 0
      generateArrowPoints(pathLength, path)
      generateLabelStyle(pathLength, path)
    })
  }
};

const generateLabelStyle = (pathLength, path) => {
  if (showLabel.value) {
    const labelPointLength = pathLength / 2
    const { x: x1, y: y1 } = path.getPointAtLength(Math.max(labelPointLength - 1, 0)) ?? origin
    const { x: x2, y: y2 } = path.getPointAtLength(labelPointLength) ?? origin
    data.labelStyle = {
      left: `${x1}px`,
      top: `${y1}px`,
      transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`
    }
  } else {
    data.labelStyle = null
  }
};

const generateArrowPoints = function (pathLength, path) {
  if (showArrow.value) {
    const arrowPointLength = pathLength * arrowPositionPercent.value
    data.arrowPoint1 = path.getPointAtLength(Math.max(arrowPointLength - 1, 0)) ?? origin
    data.arrowPoint2 = path.getPointAtLength(arrowPointLength) ?? origin
  } else {
    data.arrowPoint1 = data.arrowPoint2 = origin
  }
};

onMounted(() => {
  generatePoints()
})

watch([ lineEnds, showArrow, arrowPositionPercent, showEdgeLabels ], generatePoints)

</script>
