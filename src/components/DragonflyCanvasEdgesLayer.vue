<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <path d="M 100 100 L 300 100 L 200 300 z" fill="#f00" stroke-width="1"/>
    </svg>
</template>

<script>
export default {
    name: "DragonflyCanvasEdgesLayer"
}
</script>

<style scoped>
.dragonfly-edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    z-index: 2;
}
</style>
