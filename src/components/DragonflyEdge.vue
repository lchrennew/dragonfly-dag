<template>
    <component
        :is="lineShape.value"
        v-model:definition="definition"
        :source="source"
        :target="target"/>
    <path ref="path"
          class="edge"
          :class="{selected}"
          :d="definition"
          :marker-end="selected?'url(#anchor)':''"
          :marker-start="selected?'url(#anchor)':''"
    />
    <path
        :d="definition"
        class="edge-area"
        @mousedown="onMouseDown"
    />
    <line v-if="showArrow.value"
          :x1="arrowPoint1.x"
          :x2="arrowPoint2.x"
          :y1="arrowPoint1.y"
          :y2="arrowPoint2.y"
          class="arrow"
          marker-end="url(#arrow)"
    />
</template>

<script>

export default {
    name: "DragonflyEdge",
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'lineShape', 'selected'],
    inject: ['showArrow', 'arrowPosition', 'onSelect', 'onUnselect'],
    data() {
        return {
            definition: '',
            arrowPoint1: {x: 0, y: 0},
            arrowPoint2: {x: 0, y: 0},
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
    },
    methods: {
        generateLength() {
            const path = this.$refs.path
            const origin = {x: 0, y: 0}
            if (path && this.showArrow.value) {
                this.$nextTick(() => {
                    const pathLength = path.getTotalLength() ?? 0
                    const arrowPointLength = pathLength * this.arrowPositionPercent
                    this.arrowPoint1 = path.getPointAtLength(Math.max(arrowPointLength - 1, 0)) ?? origin
                    this.arrowPoint2 = path.getPointAtLength?.(arrowPointLength) ?? origin
                })
            } else {
                this.arrowPoint1 = this.arrowPoint2 = origin
            }
        },
        onMouseDown(event) {
            event.preventDefault()
            event.stopPropagation()
            if (this.selected) {
                this.onUnselect(this.edge.id)
            } else {
                this.onSelect({id: this.edge.id, multiple: event.shiftKey})
            }
        }
    },
    mounted() {
        this.generateLength()
    },
    watch: {
        lineEnds: 'generateLength',
        'showArrow.value': 'generateLength',
        arrowPositionPercent: 'generateLength',
    }
}
</script>
