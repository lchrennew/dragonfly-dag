<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <defs v-if="showArrow">
            <marker id="arrow"
                    markerwidth="18"
                    markerHeight="18"
                    refX="18"
                    refY="9"
                    orient="auto"
                    overflow="visible"
                    markerUnits="userSpaceOnUse"
                    :viewBox="`0 0 ${6/arrowZoomRatio} ${6/arrowZoomRatio}`"
            >
                <polygon points="0 0, 0 18, 18 9" class="arrow"/>
            </marker>
            <marker id="anchor"
                    markerwidth="18"
                    markerHeight="18"
                    refX="9"
                    refY="9"
                    overflow="visible"
                    markerUnits="userSpaceOnUse"
                    :viewBox="`0 0 6 6`"
            >
                <rect width="18" height="18" class="anchor"/>
            </marker>

        </defs>
        <dragonfly-edge
            v-for="edge in edges"
            :key="edge.id"
            :edge="edge"
            :source-node="positions[edge.source]"
            :target-node="positions[edge.target]"
            :source-endpoint="endpointPositions[edge.sourceEndpoint]"
            :target-endpoint="endpointPositions[edge.targetEndpoint]"
            :line-shape="lineShape"
            :selected="selected.value[edge.id]"
        />
        <dragonfly-linking-edge
            v-if="linking"
            :source="linkingSource"
            :target="linkingTarget"
            :line-shape="linkingLineShape.value"
        />
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
