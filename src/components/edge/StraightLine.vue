<script>
import LineShapeBase from "./LineShapeBase.vue";

export default {
    name: "StraightLine",
    extends: LineShapeBase,
    computed: {
        k() {
            const {source, target} = this.centers
            return Math.abs((source.y - target.y) / (source.x - target.x))
        },
        centers() {
            return {
                ...this.getCenter('source'),
                ...this.getCenter('target'),
            }
        },
        startPoint() {
            return this.stringifyPoint(this.getPoint(this.centers.source, this.centers.target))
        },
        endPoint() {
            return this.stringifyPoint(this.getPoint(this.centers.target, this.centers.source))
        },
    },
    methods: {
        getDefinition() {
            return `M ${this.startPoint} L ${this.endPoint} L ${this.endPoint}`
        },
        getPoint(current, ref) {
            let {x, y, halfWidth, halfHeight, k} = current
            let {x: refX, y: refY} = ref

            const vector = {
                x: x <= refX ? 1 : -1,
                y: y <= refY ? 1 : -1,
            }

            const vectorK = {
                x: this.k >= k ? k / this.k : 1,
                y: this.k >= k ? 1 : this.k / k
            }

            x += vector.x * halfWidth * vectorK.x
            y += vector.y * halfHeight * vectorK.y
            return {x, y}
        },

        getCenter(type) {
            let {x, width, y, height} = this[type]
            let halfWidth = width * 0.5, halfHeight = height * 0.5
            x += halfWidth
            y += halfHeight
            let k = height / width || 1
            return {
                [type]: {x, y, k, halfWidth, halfHeight,}
            }
        }
    }
}
</script>
