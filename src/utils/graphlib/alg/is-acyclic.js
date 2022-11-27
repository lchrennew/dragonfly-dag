import topsort from "./topsort.js";

export default g => {
    try {
        topsort(g);
    } catch (e) {
        if (e instanceof topsort.CycleException) {
            return false;
        }
        throw e;
    }
    return true;
}
