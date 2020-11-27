<template>
    <component ref="path" :source="source" :target="target" :is="lineShape.value"/>
    <line v-if="showArrow.value && pathLength"
          marker-end="url(#arrow)"
          :x1="arrowPoint1.x"
          :x2="arrowPoint2.x"
          :y1="arrowPoint1.y"
          :y2="arrowPoint2.y"
          class="arrow"
    />
</template>

<script>
import {computed} from 'vue'

export default {
    name: "DragonflyEdge",
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'selected', 'lineShape'],
    inject: ['showArrow', 'arrowPosition'],
    data() {
        return {
            pathLength: 0,
        }
    },
    computed: {
        source() {
            if (this.sourceEndpoint) {
                return {
                    x: this.sourceNode.x + this.sourceEndpoint.x,
                    y: this.sourceNode.y + this.sourceEndpoint.y,
                    width: this.sourceEndpoint.width,
                    height: this.sourceEndpoint.height,
                    orientation: this.sourceEndpoint.orientation,
                }
            } else return this.sourceNode
        },
        target() {
            if (this.targetEndpoint) {
                return {
                    x: this.targetNode.x + this.targetEndpoint.x,
                    y: this.targetNode.y + this.targetEndpoint.y,
                    width: this.targetEndpoint.width,
                    height: this.targetEndpoint.height,
                    orientation: this.sourceEndpoint.orientation,
                }
            }
            return this.targetNode
        },
        lineEnds() {
            return {source: this.source, target: this.target}
        },
        arrowPositionPercent() {
            return this.arrowPosition.value / 100
        },
        arrowPointLength() {
            return this.pathLength * this.arrowPositionPercent
        },
        arrowPoint1() {
            const length = Math.max(this.arrowPointLength - 1, 0)
            return this.$refs.path?.$el?.getPointAtLength?.(length) ?? {x: 0, y: 0}
        },
        arrowPoint2() {
            const length = this.arrowPointLength
            return this.$refs.path?.$el?.getPointAtLength?.(length) ?? {x: 0, y: 0}
        },
    },
    methods: {
        generateLength() {
            if (this.$refs.path?.$el && this.showArrow.value) {
                this.$nextTick(() => {
                    this.pathLength = this.$refs.path?.$el?.getTotalLength?.() ?? 0
                })
            } else {
                this.pathLength = 0
            }
        }
    },
    provide() {
        return {
            linking: false,
            selected: computed(() => this.selected),
        }
    },
    mounted() {
        this.generateLength()
    },
    watch: {
        lineEnds: 'generateLength',
        'showArrow.value': 'generateLength',
    }
}
</script>
