<template>
    <line
        :x1="source.x+(sourceOffset?.x??0)"
        :x2="target.x+(targetOffset?.x??0)"
        :y1="source.y+(sourceOffset?.y??0)"
        :y2="target.y+(targetOffset?.y??0)"/>
</template>

<script>
export default {
    name: "StraightLine",
    props: ['source', 'target', 'sourceOffset', 'targetOffset'],
}
</script>

<style scoped lang="less">
line {
    stroke-width: 2;
    stroke: red;
    pointer-events: none;
}
</style>
