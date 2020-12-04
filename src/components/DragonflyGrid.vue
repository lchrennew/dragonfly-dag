<template>
    <div class="dragonfly-grid">
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid-pattern"
                         :width="scaledSize"
                         :height="scaledSize"
                         patternUnits="userSpaceOnUse"
                >
                    <component :is="gridShape.value" :top="top" :left="left" :right="right" :bottom="bottom"
                               :size="scaledSize"/>
                </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" width="100%" height="100%"/>
        </svg>
    </div>
</template>

<script>
import DotGrid from "./grid/DotGrid.vue";

export default {
    name: "DragonflyGrid",
    components: {DotGrid},
    props: ['offsetX', 'offsetY', 'scale', 'size', 'maxScale', 'minScale'],
    inject: ['gridShape'],
    computed: {
        scaledSize() {
            let scale = this.scale
            if (scale >= this.maxScale) {
                do {
                    scale /= this.maxScale
                } while (scale >= this.maxScale)
            }
            if (scale <= this.minScale) {
                do {
                    scale /= this.minScale
                } while (scale <= this.minScale)
            }
            return this.size * scale
        },
        top() {
            return (this.offsetY % this.scaledSize - this.scaledSize) % this.scaledSize
        },
        left() {
            return (this.offsetX % this.scaledSize - this.scaledSize) % this.scaledSize
        },
        bottom() {
            return this.top + this.scaledSize
        },
        right() {
            return this.left + this.scaledSize
        },
    }
}
</script>
