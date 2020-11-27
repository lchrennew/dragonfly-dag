<template>
    <slot :source="source" :target="target"/>
    <line v-if="showArrow.value"
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
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'selected'],
    inject: ['showArrow', 'arrowPosition',],
    data() {
        return {
            path: null,
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
        pathLength() {
            if (this.path && this.showArrow.value && this.target && this.source) {
                return this.path.getTotalLength()
            } else return 0
        },
        arrowPositionPercent() {
            return this.arrowPosition.value / 100
        },
        arrowPointLength() {
            return this.pathLength * this.arrowPositionPercent
        },
        arrowPoint1() {
            return this.path?.getPointAtLength?.(Math.max(this.arrowPointLength - 1, 0)) ?? {x: 0, y: 0}
        },
        arrowPoint2() {
            return this.path?.getPointAtLength?.(this.arrowPointLength) ?? {x: 0, y: 0}
        }
    },
    provide() {
        return {
            linking: false,
            selected: computed(() => this.selected),
        }
    },
    mounted() {
        this.path = this.$el.nextElementSibling
    }
}
</script>
