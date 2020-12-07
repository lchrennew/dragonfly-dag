<template>
    <component
        :is="lineShape.value"
        v-model:definition="definition"
        :position="{source, target}"
    />
    <path ref="path"
          :class="{selected}"
          :d="definition"
          :marker-end="selected?'url(#anchor)':''"
          :marker-start="selected?'url(#anchor)':''"
          class="edge"
    />
    <template v-if="!readOnly.value">
        <path
            :d="definition"
            class="edge-area"
            @mousedown.left.prevent.stop="onMouseDown"
        />
    </template>
    <line v-if="showArrow.value"
          :x1="arrowPoint1.x"
          :x2="arrowPoint2.x"
          :y1="arrowPoint1.y"
          :y2="arrowPoint2.y"
          class="edge-arrow"
          marker-end="url(#arrow)"
    />
    <template v-if="edge.animate">
        <circle r="2" fill="blue">
            <animateMotion dur="1s"
                           repeatCount="indefinite"
                           :path="definition"/>
        </circle>
        <circle r="2" fill="blue">
            <animateMotion
                begin="0.5s"
                dur="1s"
                repeatCount="indefinite"
                :path="definition"/>
        </circle>
    </template>

    <foreignObject>
        <teleport :to="`#dragonfly-canvas-${canvasId}`">
            <div v-if="showLabel"
                 :style="labelStyle"
                 class="edge-label"
            >
                <slot>{{ edge.label }}</slot>
            </div>
        </teleport>
    </foreignObject>
</template>

<script>
const origin = {x: 0, y: 0}

export default {
    name: "DragonflyEdge",
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint', 'lineShape', 'selected'],
    inject: ['showArrow', 'arrowPosition', 'onSelect', 'onUnselect', 'canvasId', 'showEdgeLabels', 'readOnly'],
    data() {
        return {
            definition: '',
            arrowPoint1: {x: 0, y: 0},
            arrowPoint2: {x: 0, y: 0},
            labelStyle: null
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
            } else {
                return {
                    x: this.sourceNode.x,
                    y: this.sourceNode.y,
                    width: this.sourceNode.width,
                    height: this.sourceNode.height,
                    orientation: this.sourceNode.orientation,
                }
            }
        },
        target() {
            if (this.targetEndpoint) {
                return {
                    x: this.targetNode.x + this.targetEndpoint.x,
                    y: this.targetNode.y + this.targetEndpoint.y,
                    width: this.targetEndpoint.width,
                    height: this.targetEndpoint.height,
                    orientation: this.targetEndpoint.orientation,
                }
            } else {
                return {
                    x: this.targetNode.x,
                    y: this.targetNode.y,
                    width: this.targetNode.width,
                    height: this.targetNode.height,
                    orientation: this.targetNode.orientation,
                }
            }

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
        generateArrowPoints(pathLength, path) {
            if (this.showArrow.value) {
                const arrowPointLength = pathLength * this.arrowPositionPercent
                this.arrowPoint1 = path.getPointAtLength(Math.max(arrowPointLength - 1, 0)) ?? origin
                this.arrowPoint2 = path.getPointAtLength(arrowPointLength) ?? origin
            } else {
                this.arrowPoint1 = this.arrowPoint2 = origin
            }
        },
        generateLabelStyle(pathLength, path) {
            if (this.showLabel) {
                const labelPointLength = pathLength / 2
                const {x: x1, y: y1} = path.getPointAtLength(Math.max(labelPointLength - 1, 0)) ?? origin
                const {x: x2, y: y2} = path.getPointAtLength(labelPointLength) ?? origin
                this.labelStyle = {
                    left: `${x1}px`,
                    top: `${y1}px`,
                    transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`
                }
            } else {
                this.labelStyle = null
            }
        },
        generatePoints() {
            const path = this.$refs.path

            if (path) {
                this.$nextTick(() => {
                    const pathLength = path.getTotalLength() ?? 0
                    this.generateArrowPoints(pathLength, path)
                    this.generateLabelStyle(pathLength, path)
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
