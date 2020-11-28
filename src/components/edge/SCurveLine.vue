<script>
import LineShapeBase from "./LineShapeBase.vue";

const vectors = {
    left: [-1, 0],
    right: [1, 0],
    top: [0, -1],
    bottom: [0, 1]
}

export default {
    name: "SCurveLine",
    extends: LineShapeBase,
    computed: {
        start() {
            let {x, y, width, height, orientation = 'right'} = this.source
            const vector = vectors[orientation]
            x += vector[0] * width / 2
            y += vector[1] * height / 2
            return {x, y}
        },
        end() {
            let {x, y, width, height, orientation = 'left'} = this.target
            const vector = vectors[orientation]
            x += vector[0] * width / 2
            y += vector[1] * height / 2
            return {x, y}
        },
        startPoint() {
            return `${this.start.x},${this.start.y}`
        },
        endPoint() {
            return `${this.end.x},${this.end.y}`
        },
        control() {
            const offset = Math.abs(this.start.y - this.end.y) / 5
            let {x, y, width, height, orientation = 'right'} = this.source
            const vector = vectors[orientation]
            x += vector[0] * width / 2 + vector[0] * offset
            y += vector[1] * height / 2 + vector[1] * offset
            return {x, y}
        },
        controlPoint() {
            return `${this.control.x},${this.control.y}`
        },
        middle() {
            return {
                x: (this.start.x + this.end.x) / 2,
                y: (this.start.y + this.end.y) / 2,
            }
        },
        middlePoint() {
            return `${this.middle.x},${this.middle.y}`
        }
    },
    methods: {
        getDefinition() {
            return `M ${this.startPoint} Q ${this.controlPoint} ${this.middlePoint} T ${this.endPoint}`
        }
    }
}
</script>

<style scoped>

</style>
