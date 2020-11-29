<template>
    <svg class="dragonfly-edges-layer" xmlns="http://www.w3.org/2000/svg">
        <defs v-if="showArrow">
            <marker id="arrow"
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
            <marker id="anchor"
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
        <dragonfly-edge
            v-for="edge in edges"
            :key="edge.id"
            :edge="edge"
            :line-shape="lineShape"
            :selected="selected.value[edge.id]"
            :source-endpoint="endpointPositions[edge.sourceEndpoint]"
            :source-node="positions[edge.source]"
            :target-endpoint="endpointPositions[edge.targetEndpoint]"
            :target-node="positions[edge.target]">
            <slot name="label" :edge="edge"/>
        </dragonfly-edge>
        <dragonfly-linking-edge
            v-if="linking"
            :line-shape="linkingLineShape.value"
            :source="linkingSource"
            :target="linkingTarget"/>
    </svg>
</template>

<script>
import DragonflyEdge from "./DragonflyEdge.vue";
import DragonflyLinkingEdge from "./DragonflyLinkingEdge.vue";

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {DragonflyLinkingEdge, DragonflyEdge},
    props: ['positions', 'endpointPositions', 'linking', 'linkingSource', 'linkingTarget', 'edges', 'arrowZoomRatio'],
    inject: ['showArrow', 'lineShape', 'linkingLineShape', 'selected']
}
</script>
