<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <dragonfly-edge
            v-for="edge in edges"
            :key="edge.id"
            :source="getPosition(edge.source)"
            :target="getPosition(edge.target)"
        />
    </svg>
</template>

<script>
import DragonflyEdge from "./DragonflyEdge.vue";

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {DragonflyEdge},
    props: ['positions'],
    inject: ['edges'],
    methods: {
        getPosition(nodeId) {
            return this.positions[nodeId]
        }
    }
}
</script>

<style scoped lang="less">
.dragonfly-edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    z-index: 2;

    line {
        stroke-width: 2;
        stroke: red;
    }
}
</style>
