<template>
    <line x1="0" :x2="size" :y1="top" :y2="top" stroke-width="0.3" stroke="#000"/>
    <line x1="0" :x2="size" :y1="bottom" :y2="bottom" stroke-width="0.3" stroke="#000"/>
    <line :x1="left" :x2="left" y1="0" :y2="size" stroke-width="0.3" stroke="#000"/>
    <line :x1="right" :x2="right" y1="0" :y2="size" stroke-width="0.3" stroke="#000"/>
</template>

<script>
import GridShapeBase from "./GridShapeBase.vue";

export default {
    name: "LineGrid",
    extends: GridShapeBase
}
</script>
