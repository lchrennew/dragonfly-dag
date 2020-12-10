<script>
import ZigZagLine from "./ZigZagLine.vue";

const vectors = {
    left: [-1, 0],
    right: [1, 0],
    top: [0, -1],
    bottom: [0, 1]
}

export default {
    name: "LBrokenLine",
    extends: ZigZagLine,
    computed: {
        center() {
            return {
                x: (this.zig.x + this.zag.x) / 2,
                y: (this.zig.y + this.zag.y) / 2,
            }
        },
        smartPath() {
            const zig = this.zig
            const zag = this.zag
            const center = this.center

            const field = [
                [{x: zig.x, y: zig.y}, {x: center.x, y: zig.y}, {x: zag.x, y: zig.y}],
                [{x: zig.x, y: center.y}, {x: center.x, y: center.y}, {x: zag.x, y: center.y}],
                [{x: zig.x, y: zag.y}, {x: center.x, y: zag.y}, {x: zag.x, y: zag.y}],
            ]
            let point1 = [0, 0, this.source.orientation ?? 'right'], point2 = [2, 2, this.target.orientation ?? 'left']

            let path = [null, null, null, null]
            path[0] = field[point1[1]][point1[0]]
            path[3] = field[point2[1]][point2[0]]

            switch (point1[2]) {
                case 'left':
                    point1 = zig.x < center.x ? [0, 1, zig.y <= center.y ? 'bottom' : 'top'] : [1, 0, 'left']
                    break
                case 'right':
                    point1 = zig.x < center.x ? [1, 0, 'right'] : [0, 1, zig.y <= center.y ? 'bottom' : 'top']
                    break
                case 'top':
                    point1 = zig.y < center.y ? [1, 0, zig.x <= center.x ? 'right' : 'left'] : [0, 1, 'top']
                    break
                case 'bottom':
                    point1 = zig.y < center.y ? [0, 1, 'bottom'] : [1, 0, zig.x <= center.x ? 'right' : 'left']
                    break
            }
            path[1] = field[point1[1]][point1[0]]

            switch (point2[2]) {
                case 'left':
                    point2 = zag.x < center.x ? [2, 1, zag.y <= center.y ? 'bottom' : 'top'] : [1, 2, 'left']
                    break
                case 'right':
                    point2 = zag.x < center.x ? [1, 2, 'right'] : [2, 1, zag.y <= center.y ? 'bottom' : 'top']
                    break
                case 'top':
                    point2 = zag.y < center.y ? [1, 2, zag.x <= center.x ? 'right' : 'left'] : [2, 1, 'top']
                    break
                case 'bottom':
                    point2 = zag.y < center.y ? [2, 1, 'bottom'] : [1, 2, zag.x <= center.x ? 'right' : 'left']
                    break
            }
            path[2] = field[point2[1]][point2[0]]

            if (point1[0] !== point2[0] && point1[1] !== point2[1]) {
                switch (point1[2]) {
                    case 'left':
                    case 'right':
                        point1 = [point1[0] + 1, point1[1], 'right']
                        break
                    case 'top':
                    case 'bottom':
                        point1 = [point1[0], point1[1] + 1, 'bottom']
                        break
                }
                path = [path[0], field[point1[1]][point1[0]], path[3]]
            }
            return path.map(({x, y}) => `${x},${y}`).join(' L ')
        },
    },
    methods: {
        getDefinition() {
            console.log(this.smartPath)
            return `M ${this.startPoint} L ${this.smartPath} L ${this.endPoint}`
        },
    }
}
</script>

<style scoped>

</style>
