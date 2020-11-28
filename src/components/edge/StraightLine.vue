<script>
import LineShapeBase from "./LineShapeBase.vue";

export default {
    name: "StraightLine",
    extends: LineShapeBase,
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
        startPoint() {
            return `${this.start.x},${this.start.y}`
        },
        endPoint() {
            return `${this.end.x},${this.end.y}`
        },
    },
    methods: {
        getDefinition() {
            return `M ${this.startPoint} L ${this.endPoint} L ${this.endPoint}`
        }
    }
}
</script>
