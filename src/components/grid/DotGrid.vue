<template>
    <circle :cx="left" :cy="top" fill="#000" r="0.3" stroke="none" stroke-width="0"/>
    <circle :cx="right" :cy="top" fill="#000" r="0.3" stroke="none" stroke-width="0"/>
    <circle :cx="left" :cy="bottom" fill="#000" r="0.3" stroke="none" stroke-width="0"/>
    <circle :cx="right" :cy="bottom" fill="#000" r="0.3" stroke="none" stroke-width="0"/>
</template>

<script>
import GridShapeBase from "./GridShapeBase.vue";

export default {
    name: "DotGrid",
    extends: GridShapeBase,
}
</script>
