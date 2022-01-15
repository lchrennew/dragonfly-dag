<template>
  <div class="canvas-data">
    <h2>Nodes</h2>
    <div v-for="node in nodes" :key="node.id">{{ node }}</div>
    <h2>Edges</h2>
    <div v-for="edge in edges" :key="edge.id">{{ edge }}</div>
    <h2>Zones</h2>
    <div v-for="zone in zones" :key="zone.id">{{ zone }}</div>
    <h2>Positions</h2>
    <div>{{ positions }}</div>
    <h2>Selection</h2>
    <div>{{ selection }}</div>
  </div>
</template>

<script>
export default {
  name: "CanvasData",
  props: [ 'edges', 'nodes', 'zones', 'positions', 'selection' ]
}
</script>

<style scoped lang="less">
.canvas-data {
  width: 300px;
  position: absolute;
  right: 400px;
  top: 0;

}
</style>
