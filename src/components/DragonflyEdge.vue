<template>
    <slot :source="source" :target="target"/>
</template>

<script>
export default {
    name: "DragonflyEdge",
    props: ['edge', 'sourceNode', 'sourceEndpoint', 'targetNode', 'targetEndpoint'],
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
    },
    provide() {
        return {
            linking: false,
        }
    }
}
</script>
