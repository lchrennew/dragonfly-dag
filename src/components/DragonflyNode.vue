<script setup>
import { computed, getCurrentInstance, inject, onMounted, provide, reactive } from 'vue'
import DragonflyEndpoints from "./DragonflyEndpoints.vue";
import getNodeDraggingHandlers from "./nodeDraggingBehaviorHandlers";

const props = defineProps([ 'node', 'selected', 'group' ])
const data = reactive({
  width: 0,
  height: 0,
  inDomOffset: { x: 0, y: 0 },
  targeted: false,
  endPointRefs: [],
})
const setNodeSize = inject('setNodeSize')
const startNodeMoving = inject('startNodeMoving')
const nodeMoving = inject('nodeMoving')
const stopNodeMoving = inject('stopNodeMoving')
const startNodeLinking = inject('startNodeLinking')
const nodeLinking = inject('nodeLinking')
const stopNodeLinking = inject('stopNodeLinking')
const positions = inject('positions')
const link = inject('link')
const linkSource = inject('linkSource')
const nodeDraggingBehavior = inject('nodeDraggingBehavior')
const scale = inject('scale')
const readOnly = inject('readOnly')

const emit = defineEmits([ 'select', 'unselect' ])

onMounted(() => {
  data.width = current.refs.el.clientWidth
  data.height = current.refs.el.clientHeight
  setNodeSize(props.node.id, data.width, data.height)  // hacking: 回调DragonflyCanvasCore，提供尺寸信息
})
const onNodeDrop = event => {
  data.targeted = false
  const target = props.node.id
  if (linkableIn.value) {
    link(target)
  }
};


const bottomEndpoints =
    computed(() => props.node.endpoints ? props.node.endpoints.filter(endpoint => endpoint.orientation === 'bottom') : undefined);

const topEndpoints = computed(() => props.node.endpoints ? props.node.endpoints.filter(endpoint => endpoint.orientation === 'top') : undefined);

const rightEndpoints = computed(() => props.node.endpoints ? props.node.endpoints.filter(endpoint => endpoint.orientation === 'right') : undefined);

const leftEndpoints = computed(() => props.node.endpoints ? props.node.endpoints.filter(endpoint => !endpoint.orientation || (endpoint.orientation === 'left')) : undefined);

const position = computed(() => positions.value[props.node.id]);

const groupName = computed(() => {
  if (typeof props.group === 'string') {
    return props.group
  } else {
    return props.group?.name
  }
});

const linkableIn = computed(() => (props.node.linkable ?? true) && groupLinkIn.value(linkSource ?? {}));

const groupLinkOut = computed(() => {
  let { linkOut } = props.group ?? {}
  if (linkOut === false) {
    return () => false
  } else if (linkOut instanceof Function) {
    return linkOut
  } else {
    return () => true
  }
});

const groupLinkIn = computed(() => {
  let { linkIn, name } = props.group ?? {}

  if (typeof props.group === 'string') {
    return ({ sourceGroup }) => sourceGroup === props.group
  } else if (linkIn === false) {
    return () => false
  } else if (linkIn === undefined) {
    return ({ sourceGroup }) => name === undefined || name === sourceGroup
  } else if (typeof linkIn === 'string') {
    return ({ sourceGroup }) => linkIn === sourceGroup
  } else if (linkIn instanceof Array) {
    return ({ sourceGroup }) => linkIn.includes(sourceGroup)
  } else if (linkIn instanceof Function) {
    return linkIn
  } else {
    return () => true
  }
});

const draggable = computed(() => {
  if (readOnly.value) return false
  switch (nodeDraggingBehavior.value) {
    case 'move':
      return props.node.movable ?? true
    case 'link':
      return (props.node.linkable ?? true) && groupLinkOut(props.node)
    default:
      return false
  }
});

const y = computed(() => position.value?.y ?? 0);

const x = computed(() => position.value?.x ?? 0);

const current = getCurrentInstance()
const nodeDraggingBehaviorHandlers = getNodeDraggingHandlers({
  data,
  props,
  computed: {
    draggable,
    groupName,
    position,
    x,
    y,
    groupLinkOut,
  },
  methods: {
    startNodeMoving,
    nodeMoving,
    stopNodeMoving,
    startNodeLinking,
    nodeLinking,
    stopNodeLinking,
  }
})


const onNodeDragging = event => nodeDraggingBehaviorHandlers[nodeDraggingBehavior.value]?.[event.type]?.(event);

const onMouseDown = event => {
  const rect = current.refs.el.getBoundingClientRect()
  data.inDomOffset.x = (event.x - rect.x) / scale.value
  data.inDomOffset.y = (event.y - rect.y) / scale.value

  if (props.selected) {
    event.shiftKey && emit('unselect', props.node.id)
  } else {
    emit('select', { id: props.node.id, multiple: event.shiftKey })
  }
};

provide('node', computed(() => props.node))
provide('nodePosition', computed(() => position.value))
provide('select', () => emit('select', { id: props.node.id }))
</script>

<template>
  <div
      ref="el"
      :class="{selected, targeted: data.targeted}"
      :style="{left: `${x}px`, top:`${y}px`}"
      class="dragonfly-node"
  >
    <div class="dragonfly-node-inner"
         ref="inner"
         @mousedown.left.capture.stop="onMouseDown"
         :draggable="draggable"
         @drop="onNodeDrop"
         @dragstart="onNodeDragging"
         @drag.passive="onNodeDragging"
         @dragend.prevent="onNodeDragging"
         @dragenter.stop="onNodeDragging"
         @dragleave.stop="onNodeDragging"
    >
      <slot/>
    </div>
    <dragonfly-endpoints
        orientation="left"
        :endpoints="leftEndpoints"
    >
      <slot name="leftEndpoints"/>
    </dragonfly-endpoints>
    <dragonfly-endpoints
        orientation="right"
        :endpoints="rightEndpoints"
    >
      <slot name="rightEndpoints"/>
    </dragonfly-endpoints>
    <dragonfly-endpoints
        orientation="top"
        :endpoints="topEndpoints"
    >
      <slot name="topEndpoints"/>
    </dragonfly-endpoints>
    <dragonfly-endpoints
        orientation="bottom"
        :endpoints="bottomEndpoints"
    >
      <slot name="bottomEndpoints"/>
    </dragonfly-endpoints>
  </div>
</template>
