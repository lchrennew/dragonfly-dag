<script>
import LBrokenLine from './LBrokenLine.vue';

export default {
    name: 'LRoundedCornerLine',
    extends: LBrokenLine,
    computed: {
        smartPath() {
            const path = [ this.startPoint ]
            const pointsOnBrokenLine = [ this.start, ...this.smartPathPoints, this.end ]
            const maxRadius = 10
            for (let i = 2; i < pointsOnBrokenLine.length; i++) {
                const { x: x0, y: y0 } = pointsOnBrokenLine[i - 2],
                    { x: x1, y: y1 } = pointsOnBrokenLine[i - 1],
                    { x: x2, y: y2 } = pointsOnBrokenLine[i]
                if (x0 === x2 || y0 === y2) continue

                let xa, ya, xb, yb, cw, r = Math.min(maxRadius, Math.abs(x2 - x0) / 2, Math.abs(y2 - y0) / 2)

                if (x1 > x0) { // 向右
                    xa = x1 - r
                    ya = y1
                    xb = r
                    cw = 1
                } else if (x1 < x0) { // 向左
                    xa = x1 + r
                    ya = y1
                    xb = -r
                    cw = 0
                }
                if (y1 > y2) { // 向上
                    yb = -r
                    cw ^= 1
                } else if (y1 < y2) { // 向下
                    yb = r
                    cw ^= 0
                }

                if (y1 > y0) { // 向下
                    ya = y1 - r
                    xa = x1
                    yb = r
                    cw = 0
                } else if (y1 < y0) { // 向上
                    ya = y1 + r
                    xa = x1
                    yb = -r
                    cw = 1
                }
                if (x1 > x2) { // 向左
                    xb = -r
                    cw ^= 1
                } else if (x1 < x2) { // 向右
                    xb = r
                    cw ^= 0
                }
                path.push(`${xa},${ya} a${r},${r} 0 0,${cw} ${xb},${yb}`)
            }
            path.push(this.endPoint)
            return path.join(' L ')
        }
    },
    methods: {
        getDefinition() {
            return `M ${this.smartPath}`
        },
    }
}
</script>
