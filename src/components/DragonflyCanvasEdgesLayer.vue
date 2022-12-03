<template>
    <svg class="dragonfly-edges-layer" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <marker
                v-if="showArrow"
                id="arrow"
                :viewBox="`0 0 ${6/arrowZoomRatio} ${6/arrowZoomRatio}`"
                markerHeight="18"
                markerUnits="userSpaceOnUse"
                markerwidth="18"
                orient="auto"
                overflow="visible"
                refX="18"
                refY="9"
            >
                <path class="arrow" d="M 0,0 L 0,18 L 18,9 Z"/>
            </marker>
            <marker
                id="anchor"
                :viewBox="`0 0 6 6`"
                markerHeight="18"
                markerUnits="userSpaceOnUse"
                markerwidth="18"
                overflow="visible"
                refX="9"
                refY="9"
            >
                <path class="anchor" d="M 0,0 L 0,18 L 18,18 L 18,0 Z"/>
            </marker>

        </defs>
        <template
            v-for="edge in edges"
            :key="edge.id">
            <dragonfly-edge
                v-if="isVisible(edge)"
                :edge="edge"
                :line-shape="lineShape"
                :selected="selected[edge.id]"
                :source-endpoint="endpointPositions[edge.sourceEndpoint]"
                :source-node="positions[edge.source]"
                :target-endpoint="endpointPositions[edge.targetEndpoint]"
                :target-node="positions[edge.target]">
                <slot :edge="edge" name="label"/>
            </dragonfly-edge>
        </template>
        <dragonfly-linking-edge
            v-if="linking"
            :line-shape="linkingLineShape"
            :source="linkingSource"
            :target="linkingTarget"/>
    </svg>
</template>

<script setup>
import DragonflyEdge from "./DragonflyEdge.vue";
import DragonflyLinkingEdge from "./DragonflyLinkingEdge.vue";
import { computed, inject } from "vue";
import { zoomLevel } from "../utils/device-pixel-ratio.js";

const props = defineProps([ 'positions', 'endpointPositions', 'linking', 'linkingSource', 'linkingTarget', 'edges', 'arrowZoomRatio' ])
const showArrow = inject('showArrow')
const lineShape = inject('lineShape')
const linkingLineShape = inject('linkingLineShape')
const selected = inject('selected')
// const antiZoomLevel = computed(() => 1 / zoomLevel.value)
const isVisible = edge => {
    const sourceReady = props.positions[edge.source]
    const targetReady = props.positions[edge.target]
    const sourceEndpointReady = !edge.sourceEndpoint || props.endpointPositions[edge.sourceEndpoint]
    const targetEndpointReady = !edge.targetEndpoint || props.endpointPositions[edge.targetEndpoint]
    return sourceReady && targetReady && sourceEndpointReady && targetEndpointReady
};
</script>
<style scoped lang="less">
//.dragonfly-edges-layer {
//    transform: scale(v-bind(antiZoomLevel));
//}
</style>
