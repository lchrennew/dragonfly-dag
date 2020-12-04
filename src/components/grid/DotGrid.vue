<template>
    <circle r="0.3" :cx="left" :cy="top" fill="#000" stroke="none" stroke-width="0"/>
    <circle r="0.3" :cx="right" :cy="top" fill="#000" stroke="none" stroke-width="0"/>
    <circle r="0.3" :cx="left" :cy="bottom" fill="#000" stroke="none" stroke-width="0"/>
    <circle r="0.3" :cx="right" :cy="bottom" fill="#000" stroke="none" stroke-width="0"/>
</template>

<script>
import GridShapeBase from "./GridShapeBase.vue";

export default {
    name: "DotGrid",
    extends: GridShapeBase,
}
</script>
