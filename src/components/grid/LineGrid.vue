<template>
    <line :x2="size" :y1="top" :y2="top" stroke="#000" stroke-width="0.3" x1="0"/>
    <line :x2="size" :y1="bottom" :y2="bottom" stroke="#000" stroke-width="0.3" x1="0"/>
    <line :x1="left" :x2="left" :y2="size" stroke="#000" stroke-width="0.3" y1="0"/>
    <line :x1="right" :x2="right" :y2="size" stroke="#000" stroke-width="0.3" y1="0"/>
</template>

<script>
import GridShapeBase from "./GridShapeBase.vue";

export default {
    name: "LineGrid",
    extends: GridShapeBase
}
</script>
