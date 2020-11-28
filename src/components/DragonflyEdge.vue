<template>
    <component
        :is="lineShape.value"
        v-model:definition="definition"
        :source="source"
        :target="target"/>
    <path ref="path"
          :class="{selected}"
          :d="definition"
          :marker-end="selected?'url(#anchor)':''"
          :marker-start="selected?'url(#anchor)':''"
          class="edge"
    />
    <path
        :d="definition"
        class="edge-area"
        @mousedown.prevent.stop="onMouseDown"
    />
    <line v-if="showArrow.value"
          :x1="arrowPoint1.x"
          :x2="arrowPoint2.x"
          :y1="arrowPoint1.y"
          :y2="arrowPoint2.y"
          class="edge-arrow"
          marker-end="url(#arrow)"
    />
</template>

<script>
const origin = {x: 0, y: 0}

export default {
    name: "DragonflyEdge",
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'lineShape', 'selected', 'labelPosition'],
    inject: ['showArrow', 'arrowPosition', 'onSelect', 'onUnselect', 'canvasId', 'showEdgeLabels', 'setEdgeLabelPosition', 'deleteEdgeLabelPosition'],
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
        showLabel() {
            return this.showEdgeLabels.value && (this.edge.showLabel ?? true) && this.edge.label
        },
    },
    methods: {
        generateArrowPoints(pathLength) {
            if (this.showArrow.value) {
                const arrowPointLength = pathLength * this.arrowPositionPercent
                this.arrowPoint1 = path.getPointAtLength(Math.max(arrowPointLength - 1, 0)) ?? origin
                this.arrowPoint2 = path.getPointAtLength(arrowPointLength) ?? origin
            } else {
                this.arrowPoint1 = this.arrowPoint2 = origin
            }
        },
        generateLabelStyle(pathLength) {
            if (this.showLabel) {
                const labelPointLength = pathLength / 2
                const {x: x1, y: y1} = path.getPointAtLength(Math.max(labelPointLength - 1, 0)) ?? origin
                const {x: x2, y: y2} = path.getPointAtLength(labelPointLength) ?? origin
                this.setEdgeLabelPosition(this.edge.id, {
                    left: `${x1}px`,
                    top: `${y1}px`,
                    transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`
                })
            } else {
                this.deleteEdgeLabelPosition(this.edge.id)
            }
        },
        generatePoints() {
            const path = this.$refs.path

            if (path) {
                this.$nextTick(() => {
                    const pathLength = path.getTotalLength() ?? 0
                    this.generateArrowPoints(pathLength)
                    this.generateLabelStyle(pathLength)
                })
            }
        },
        onMouseDown(event) {
            if (this.selected) {
                this.onUnselect(this.edge.id)
            } else {
                this.onSelect({id: this.edge.id, multiple: event.shiftKey})
            }
        }
    },
    mounted() {
        this.generatePoints()
    },
    watch: {
        lineEnds: 'generatePoints',
        'showArrow.value': 'generatePoints',
        arrowPositionPercent: 'generatePoints',
        'showEdgeLabels.value': 'generatePoints',
    }
}
</script>
