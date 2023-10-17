
enum PositionsTypes {
    top = "top",
    bottom = "bottom",
    left = "left",
    right = "right",
    top_left = top + "-" + left,
    top_right = top + "-" + right,
    bottom_left = bottom + "-" + left,
    bottom_right = bottom + "-" + right
}


class ComponentFrame {


    static positionsTypes = [
        PositionsTypes.top,
        PositionsTypes.bottom,
        PositionsTypes.left,
        PositionsTypes.right,
        PositionsTypes.top_left,
        PositionsTypes.top_right,
        PositionsTypes.bottom_left,
        PositionsTypes.bottom_right
    ];

    private div: HTMLElement;
    private moveDiv: HTMLElement;
    private element: HTMLElement;
    Workspace: WorkSpace;
    private dots: Array<HTMLElement> = new Array<HTMLElement>();

    constructor(element: HTMLElement) {
        this.element = element;

        let div: HTMLElement = document.createElement("DIV");
        div.classList.add("component-frame");

        for (let i: number = 0; i < 8; i++) {
            let sizeDot: HTMLElement = document.createElement("DIV");
            sizeDot.classList.add("size-dot");
            sizeDot.classList.add(ComponentFrame.positionsTypes[i]);

            if ("ontouchstart" in document.documentElement) {
                sizeDot.addEventListener('touchstart', (event: any) => this.onTouchStart(event, sizeDot), false);
                sizeDot.addEventListener('touchmove', (event: any) => this.onTouchMove(event, sizeDot), false);
                sizeDot.addEventListener('touchend', (event: any) => this.onTouchEnd(event, sizeDot), false);
            }
            else {
                sizeDot.addEventListener('mousedown', (event: any) => this.onMouseDown(event, sizeDot), false);
                sizeDot.addEventListener('mousemove', (event: any) => this.onMouseMove(event, sizeDot), false);
                sizeDot.addEventListener('mouseup', (event: any) => this.onMouseUp(event, sizeDot), false);
            }

            this.dots.push(sizeDot);
            div.appendChild(sizeDot);
        }

        this.moveDiv = document.createElement("DIV");
        this.moveDiv.classList.add("move-dot");
        if ("ontouchstart" in document.documentElement) {
            this.moveDiv.addEventListener('touchstart', (event: any) => this.onTouchStart(event, null), false);
            this.moveDiv.addEventListener('touchmove', (event: any) => this.onTouchMove(event, null), false);
            this.moveDiv.addEventListener('touchend', (event: any) => this.onTouchEnd(event, null), false);
        }
        else {
            this.moveDiv.addEventListener('mousedown', (event: any) => this.onMouseDown(event, null), false);
            this.moveDiv.addEventListener('mousemove', (event: any) => this.onMouseMove(event, null), false);
            this.moveDiv.addEventListener('mouseup', (event: any) => this.onMouseUp(event, null), false);
        }
        div.appendChild(this.moveDiv);

        this.div = div;
        this.ApplySizeToFrame(this.element.clientWidth, this.element.clientHeight);
        this.ApplyOffsetToFrame(this.element.offsetLeft, this.element.offsetTop);

        this.element.parentElement.appendChild(div);
    }

    UpdateLayout(): void {
        this.ApplySizeToFrame(this.element.clientWidth, this.element.clientHeight);
        this.ApplyOffsetToFrame(this.element.offsetLeft, this.element.offsetTop);
    }

    CalulateMinimumFrmaeSize() {
        if (this.dots.length > 0) {
            let dpi = this.Workspace.getPixelPerVW();
            this.frameMinimumSize_px.x = dpi.x * this.frameMinimumSize_vw.x;
            this.frameMinimumSize_px.y = dpi.y * this.frameMinimumSize_vw.y;
        }
    }

    CalculateSnapSize() {
        if (this.dots.length > 0) {
            let dpi = this.Workspace.getPixelPerVW();
            this.snapSize_px.x = dpi.x * this.snapSize_vw.x;
            this.snapSize_px.y = dpi.y * this.snapSize_vw.y;
            //console.log(this.snapSize_px)
        }
    }

    ApplyOffsetToFrame(x: number, y: number): void {
        this.div.style.left = `${x}px`;
        this.div.style.top = `${y}px`;
    }

    ApplySizeToFrame(w: number, h: number): void {
        this.div.style.width = `${w}px`;
        this.div.style.height = `${h}px`;
    }

    private pressed: boolean = false;
    private sizeDot: HTMLElement = null;
    private startSize: Point = new Point();
    private startPos: Point = new Point();
    private cursorStart: Point = new Point();
    private cursorCurrent: Point = new Point();
    private snapSize_vw = new Point(0.5, 0.5);
    private snapSize_px = new Point();
    private frameMinimumSize_px = new Point();
    private frameMinimumSize_vw = new Point(3, 3);

    private beginEdit() {
        console.log("beginEdit");
        this.CalulateMinimumFrmaeSize();
        this.CalculateSnapSize();
        if (this.sizeDot == null)
            this.moveDiv.classList.add("current");
        else
            this.sizeDot.classList.add("current");
        this.startPos = this.snapPoint(new Point(this.div.offsetLeft, this.div.offsetTop));
        this.startSize = this.snapPoint(new Point(this.div.clientWidth, this.div.clientHeight))
        this.div.style.zIndex = "100";
    }

    private endEdit() {
        if (this.sizeDot == null)
            this.moveDiv.classList.remove("current");
        else
            this.sizeDot.classList.remove("current");
        this.sizeDot = null;
        this.div.style.zIndex = "0";
    }

    private onTouchStart(event, sizeDot: HTMLElement): void {
        this.pressed = true;
        this.sizeDot = sizeDot;
        this.beginEdit();
        this.cursorStart = this.snapPoint(Slider.pointFromTouch(this.div, event.targetTouches[0]));
    }
    private onTouchMove(event: TouchEvent, sizeDot: HTMLElement) {
        event.preventDefault();
        if (this.pressed === true) {
            this.cursorCurrent = this.snapPoint(Slider.pointFromTouch(this.div, event.targetTouches[0]));
            this.ResizeFrame();
        }
    }
    private onTouchEnd(event, sizeDot: HTMLElement): void {
        this.pressed = false;
        this.endEdit();
    }

    private onMouseDown(event, sizeDot: HTMLElement): void {
        this.pressed = true;
        this.sizeDot = sizeDot;
        this.beginEdit();
        this.cursorStart = this.snapPoint(Slider.pointFromMouseEvent(this.div, event));
        event.preventDefault();
    }
    private onMouseMove(event, sizeDot: HTMLElement): void {
        if (this.pressed === true /*&& event.target === this.element*/) {
            this.cursorCurrent = this.snapPoint(Slider.pointFromMouseEvent(this.div, event));
            this.ResizeFrame();
            event.preventDefault();
        }
    }
    private onMouseUp(event, sizeDot: HTMLElement): void {
        event.preventDefault();
        this.pressed = false;
        this.endEdit();
    }

    private snapPoint(pt: Point): Point {
        let ret = new Point();
        ret.x = Math.round(pt.x / this.snapSize_px.x) * this.snapSize_px.x;
        ret.y = Math.round(pt.y / this.snapSize_px.y) * this.snapSize_px.y;
        return ret;
    }

    private ResizeFrame() {
        if (this.pressed != true) return;
        //if (this.sizeDot == null) return;
        let delta: Point = new Point();
        delta.x = this.cursorCurrent.x - this.cursorStart.x;
        delta.y = this.cursorCurrent.y - this.cursorStart.y;

        let newPos: Point = new Point();
        newPos.x = this.startPos.x;
        newPos.y = this.startPos.y;

        let newSize: Point = new Point();
        newSize.x = this.startSize.x;
        newSize.y = this.startSize.y;

        if (this.sizeDot == null) {
            //move div captured
            this.startPos.x += delta.x;
            newPos.x += delta.x;

            this.startPos.y += delta.y;
            newPos.y += delta.y;

        } else {
            //sizeDot captured
            if (
                this.sizeDot.classList.contains(PositionsTypes.top)
                || this.sizeDot.classList.contains(PositionsTypes.top_left)
                || this.sizeDot.classList.contains(PositionsTypes.top_right)
            ) {
                this.startPos.y += delta.y;
                this.startSize.y -= delta.y;
                newPos.y += delta.y;
                newSize.y += -delta.y;
                if (newSize.y < this.frameMinimumSize_px.y) {
                    let i = this.frameMinimumSize_px.y - newSize.y;
                    this.startPos.y -= i;
                    this.startSize.y += i;
                    newPos.y -= i;
                    newSize.y += i;
                }
            }
            if (this.sizeDot.classList.contains(PositionsTypes.bottom)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_left)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_right)
            ) {
                newSize.y += delta.y;
            }

            if (this.sizeDot.classList.contains(PositionsTypes.left)
                || this.sizeDot.classList.contains(PositionsTypes.top_left)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_left)

            ) {
                this.startPos.x += delta.x;
                this.startSize.x -= delta.x;
                newPos.x += delta.x;
                newSize.x += -delta.x;
                if (newSize.x < this.frameMinimumSize_px.x) {
                    let i = this.frameMinimumSize_px.x - newSize.x;
                    this.startPos.x -= i;
                    this.startSize.x += i;
                    newPos.x -= i;
                    newSize.x += i;
                }
            }
            if (this.sizeDot.classList.contains(PositionsTypes.right)
                || this.sizeDot.classList.contains(PositionsTypes.top_right)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_right)

            ) {
                newSize.x += delta.x;
            }
            if (newSize.x < this.frameMinimumSize_px.x) newSize.x = this.frameMinimumSize_px.x;
            if (newSize.y < this.frameMinimumSize_px.y) newSize.y = this.frameMinimumSize_px.y;

        }
        //console.log(newPos);
        this.ApplySizeToFrame(newSize.x, newSize.y);
        this.ApplyOffsetToFrame(newPos.x, newPos.y);
    }
}