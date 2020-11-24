<template>
    <polyline
        :points="points"
        marker-end="url(#arrow)"
        :class="{linking}"
    />
</template>

<script>
import StraightLine from "./StraightLine.vue";

const offset = 20
const vectors = {
    left: [-1, 0],
    right: [1, 0],
    top: [0, -1],
    bottom: [0, 1]
}

export default {
    name: "ZigZagLine",
    extends: StraightLine,
    computed: {
        startPoint() {
            return `${this.source.x},${this.source.y}`
        },
        endPoint() {
            let {x, y, width, height, orientation = 'left'} = this.target
            const vector = vectors[orientation]
            x += vector[0] * width / 2
            y += vector[1] * height / 2
            return `${x},${y}`
        },
        zigPoint() {
            let {x, y, width, height, orientation = 'right'} = this.source
            const vector = vectors[orientation]
            x += vector[0] * width / 2 + vector[0] * offset
            y += vector[1] * height / 2 + vector[1] * offset
            return `${x},${y}`
        },
        zagPoint() {
            let {x, y, width, height, orientation = 'left'} = this.target
            const vector = vectors[orientation]
            x += vector[0] * width / 2 + vector[0] * offset
            y += vector[1] * height / 2 + vector[1] * offset
            return `${x},${y}`
        },
        points() {
            return `${this.startPoint} ${this.zigPoint} ${this.zagPoint} ${this.endPoint}`
        }
    },
    inject: ['linking'],
}
</script>
