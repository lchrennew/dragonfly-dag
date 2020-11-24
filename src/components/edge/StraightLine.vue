<template>
    <line
        :x1="source.x"
        :x2="target.x"
        :y1="source.y"
        :y2="target.y"
        marker-end="url(#arrow)"
        :class="{linking}"
    />
</template>

<script>
export default {
    name: "StraightLine",
    props: ['source', 'target'],
    inject:['linking']
}
</script>
