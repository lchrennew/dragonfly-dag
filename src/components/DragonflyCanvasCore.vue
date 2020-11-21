<template>
    <div class="dragonfly-canvas" ref="canvas"
         :style="{transform:`scale(${scale})`, top: `${offsetY}px`, left:`${offsetX}px`}">
        <div class="ref"></div>
        <dragonfly-node v-for="node in nodes" :key="node.id" :node="node">
            <slot :node="node" name="node">{{ node.id }}</slot>
        </dragonfly-node>
        <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edge-layer">
            <path d="M 100 100 L 300 100 L 200 300 z" fill="#f00" stroke-width="1"/>
        </svg>
    </div>
</template>

<script>
import DragonflyNode from "./DragonflyNode.vue";

export default {
    name: "DragonflyCanvasCore",
    components: {DragonflyNode},
    props: ['offsetX', 'offsetY', 'scale'],
    inject: ['nodes', 'edges'],
}
</script>

<style scoped lang="less">
.dragonfly-canvas {
    position: relative;
    overflow: visible;
    width: 100%;
    height: 100%;

    .ref {
        display: block;
        width: 4px;
        height: 4px;
        margin-top: -2px;
        margin-bottom: -2px;
        background-color: red;
        position: absolute;
        left: 50%;
        top: 50%;
    }

    .dragonfly-edge-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        overflow: visible;
    }
}
</style>
