<template>
    <template v-for="x in 4">
        <rect v-for="y in 4"
              :x="left+(x-1)*halfSize"
              :y="top+(y-1)*halfSize"
              width="50%"
              height="50%"
              stroke="none"
              stroke-width="0"
              :fill="(x%2)-(y%2)?'#fff':'#eee'"
        />
    </template>
</template>

<script>
import GridShapeBase from "./GridShapeBase.vue";

export default {
    name: "TileGrid",
    extends: GridShapeBase,
    computed: {
        halfSize() {
            return this.size / 2
        }
    }
}
</script>
