<template>
    <line
        v-if="source && target"
        :x1="source.x"
        :x2="target.x"
        :y1="source.y"
        :y2="target.y"/>
</template>

<script>
export default {
    name: "DragonflyEdge",
    props: ['source', 'target'],
    computed: {}
}
</script>

<style scoped>

</style>
