<template>
    <line
        :x1="start.x"
        :x2="center.x"
        :y1="start.y"
        :y2="center.y"
        :marker-end="midArrow?'url(#arrow)':''"
        :class="{linking}"
    />
    <line
        :x1="center.x"
        :x2="end.x"
        :y1="center.y"
        :y2="end.y"
        :marker-end="midArrow?'':'url(#arrow)'"
        :class="{linking}"
    />
</template>

<script>
export default {
    name: "StraightLine",
    props: ['source', 'target'],
    inject: ['linking', 'midArrow'],
    computed: {
        k() {
            return Math.abs((this.source.y - this.target.y) / (this.source.x - this.target.x))
        },
        sourceK() {
            return this.source.height / this.source.width
        },
        targetK() {
            return this.target.height / this.target.width
        },
        start() {
            let {x, y, width, height} = this.source
            width /= 2
            height /= 2
            const vector = {
                x: this.source.x <= this.target.x ? 1 : -1,
                y: this.source.y <= this.target.y ? 1 : -1,
            }

            const vectorK = {
                x: this.k >= this.sourceK ? 1 / this.k : 1,
                y: this.k >= this.sourceK ? 1 : this.k
            }

            x += vector.x * width * vectorK.x || 0
            y += vector.y * height * vectorK.y || 0
            return {x, y}
        },
        center() {
            return {
                x: (this.source.x + this.target.x) / 2,
                y: (this.source.y + this.target.y) / 2,
            }
        },
        end() {
            let {x, y, width, height} = this.target
            width /= 2
            height /= 2

            const vector = {
                x: this.target.x < this.source.x ? 1 : -1,
                y: this.target.y < this.source.y ? 1 : -1,
            }

            const vectorK = {
                x: this.k >= this.targetK ? 1 / this.k : 1,
                y: this.k >= this.targetK ? 1 : this.k
            }

            x += vector.x * width * vectorK.x || 0
            y += vector.y * height * vectorK.y || 0
            return {x, y}
        },
    }
}
</script>
