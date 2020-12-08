const getActualIntercepts = (intercept1, intercept2, blood) => ({
    intercept1: Math.min(intercept1, intercept2) - blood,
    intercept2: Math.max(intercept1, intercept2) + blood,
})

const calculateArea = rect => Math.abs((rect[0][0] - rect[1][0]) * (rect[0][1] - rect[1][1]))

export function intersect(rect1, rect2, blood = 0.5) {
    const {intercept1: x1, intercept2: x2} = getActualIntercepts(rect1[0][0], rect1[1][0], blood)
    const {intercept1: x3, intercept2: x4} = getActualIntercepts(rect2[0][0], rect2[1][0], blood)
    const {intercept1: y1, intercept2: y2} = getActualIntercepts(rect1[0][1], rect1[1][1], blood)
    const {intercept1: y3, intercept2: y4} = getActualIntercepts(rect2[0][1], rect2[1][1], blood)

    const intersectedX = x1 <= x4 && x2 >= x3
    const intersectedY = y1 <= y4 && y2 >= y3
    if (!intersectedX || !intersectedY) return {r1: 0, r2: 0}
    const [, intersectionX1, intersectionX2,] = [rect1[0][0], rect1[1][0], rect2[0][0], rect2[1][0]].sort((a, b) => a - b)
    const [, intersectionY1, intersectionY2,] = [rect1[0][1], rect1[1][1], rect2[0][1], rect2[1][1]].sort((a, b) => a - b)

    const area1 = calculateArea(rect1),
        area2 = calculateArea(rect2),
        areaIntersection = calculateArea([[intersectionX1, intersectionY1], [intersectionX2, intersectionY2]])
    return {
        r1: areaIntersection / area1,
        r2: areaIntersection / area2,
        a1: area1,
        a2: area2,
        ai: areaIntersection,
    }
}
