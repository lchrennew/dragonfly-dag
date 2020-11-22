<template>
    <div class="canvas-data">
        <h2>Nodes</h2>
        <div v-for="node in nodes" :key="node.id">{{ node }}</div>
        <h2>Edges</h2>
        <div v-for="edge in edges" :key="edge.id">{{ edge }}</div>
    </div>
</template>

<script>
export default {
    name: "CanvasData",
    props: ['edges', 'nodes']
}
</script>

<style scoped lang="less">
.canvas-data {
    width: 300px;
    position: absolute;
    right: 200px;
    top: 0;

}
</style>
