const unlink = entry => {
    entry._prev._next = entry._next;
    entry._next._prev = entry._prev;
    delete entry._next;
    delete entry._prev;
};

const filterOutLinks = (k, v) => {
    if (k !== "_next" && k !== "_prev") {
        return v;
    }
};

/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */
export default class List {
    constructor() {
        const sentinel = {};
        sentinel._next = sentinel._prev = sentinel;
        this._sentinel = sentinel;
    }

    dequeue() {
        const sentinel = this._sentinel;
        const entry = sentinel._prev;
        if (entry !== sentinel) {
            unlink(entry);
            return entry;
        }
    }

    enqueue(entry) {
        const sentinel = this._sentinel;
        if (entry._prev && entry._next) {
            unlink(entry);
        }
        entry._next = sentinel._next;
        sentinel._next._prev = entry;
        sentinel._next = entry;
        entry._prev = sentinel;
    }

    toString() {
        const strs = [];
        const sentinel = this._sentinel;
        let curr = sentinel._prev;
        while (curr !== sentinel) {
            strs.push(JSON.stringify(curr, filterOutLinks));
            curr = curr._prev;
        }
        return "[" + strs.join(", ") + "]";
    }
}
