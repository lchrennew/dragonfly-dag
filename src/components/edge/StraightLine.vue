<template>
    <line
        :x1="source.x"
        :x2="target.x"
        :y1="source.y"
        :y2="target.y"/>
</template>

<script>
export default {
    name: "StraightLine",
    props: ['source', 'target'],
}
</script>

<style scoped lang="less">
line {
    stroke-width: 2;
    stroke: red;
}
</style>
