const shiftStrategies = {
    disabled: (selected, selecting) => selecting,
    continue: (selected, selecting) => selected || selecting,
    reverse: (selected, selecting) => selecting ? !selected : selected
}
export default shiftStrategies
