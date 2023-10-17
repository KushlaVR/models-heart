class Point {

    constructor(x?: number, y?: number) {
        if (x) this.x = x;
        if (y) this.y = y;
    }

    x: number = 0;
    y: number = 0;
};
