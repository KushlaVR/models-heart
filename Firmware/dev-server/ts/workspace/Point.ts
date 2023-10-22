class Point {

    constructor(x?: number, y?: number) {
        if (x) this.x = x;
        if (y) this.y = y;
    }

    x: number = 0;
    y: number = 0;

    public Round(grid: Point): Point {
        let ret = new Point();
        ret.x = Math.round(this.x / grid.x) * grid.x;
        ret.y = Math.round(this.y / grid.y) * grid.y;
        return ret;
    }
};
