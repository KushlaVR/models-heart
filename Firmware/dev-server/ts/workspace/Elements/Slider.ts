
class Slider extends Input {

    private handle: HTMLElement;
    private pot: HTMLElement;

    private pressed: boolean = false;

    private handlePos: Point = new Point();
    private value: Point = new Point();
    private center: Point = new Point();

    public autoCenterX: boolean = false;
    public autoCenterY: boolean = false;

    constructor(element: any) {
        super(element);
        this.handle = $(".handle", element)[0];
        var pot = $(".pot", element)
        if (pot.length > 0) {
            this.pot = pot[0];
        }

        if ("ontouchstart" in document.documentElement) {
            this.element.addEventListener('touchstart', (event: any) => this.onTouchStart(event), false);
            this.element.addEventListener('touchmove', (event: any) => this.onTouchMove(event), false);
            this.element.addEventListener('touchend', (event: any) => this.onTouchEnd(event), false);
        }
        else {
            this.element.addEventListener('mousedown', (event: any) => this.onMouseDown(event), false);
            this.element.addEventListener('mousemove', (event: any) => this.onMouseMove(event), false);
            this.element.addEventListener('mouseup', (event: any) => this.onMouseUp(event), false);
        }

        this.initLayout();

        if ($(element).data("center")) {
            this.autoCenterX = true;
            this.autoCenterY = true;
        } else if ($(element).data("center-x")) {
            this.autoCenterX = true;
        } else if ($(element).data("center-y")) {
            this.autoCenterY = true;
            this.autoCenterY = true;
        }

        this.refreshLayout(true);
    }

    private onTouchStart(event): void {
        this.pressed = true;
        this.element.style.zIndex = "100";
    }
    private onTouchMove(event: TouchEvent) {
        // Prevent the browser from doing its default thing (scroll, zoom)
        event.preventDefault();
        if (this.pressed === true) {
            this.handlePos = Slider.pointFromTouch(this.element, event.targetTouches[0])
            this.refreshLayout(false);
            this.saveValue();
        }
    }
    private onTouchEnd(event): void {
        this.pressed = false;
        // If required reset position store variable
        if (this.autoCenterX)
            this.handlePos.x = this.center.x;
        if (this.autoCenterY)
            this.handlePos.y = this.center.y;
        this.refreshLayout(true);
        this.saveValue();
        this.element.style.zIndex = "0";
    }

    private onMouseDown(event): void {
        this.pressed = true;
        this.element.style.zIndex = "100";
    }
    private onMouseMove(event): void {
        if (this.pressed === true /*&& event.target === this.element*/) {
            this.handlePos = Slider.pointFromMouseEvent(this.element, event);
            this.refreshLayout(false);
            this.saveValue();
        }
    }
    private onMouseUp(event): void {
        this.pressed = false;
        // If required reset position store variable
        if (this.autoCenterX)
            this.handlePos.x = this.center.x;
        if (this.autoCenterY)
            this.handlePos.y = this.center.y;
        this.refreshLayout(true);
        this.saveValue();
        this.element.style.zIndex = "0";
    }

    private refreshLayout(clip: boolean): void {
        if (clip) {
            if (this.handlePos.x < 0) this.handlePos.x = 0;
            if (this.handlePos.y < 0) this.handlePos.y = 0;
            if (this.handlePos.x > this.element.clientWidth) this.handlePos.x = this.element.clientWidth;
            if (this.handlePos.y > this.element.clientHeight) this.handlePos.y = this.element.clientHeight;
        }

        this.handle.style.left = '' + (this.handlePos.x - (this.handle.clientWidth / 2)) + 'px';
        this.handle.style.top = '' + (this.handlePos.y - (this.handle.clientHeight / 2)) + 'px';


        var clipped: Point = new Point();
        clipped.x = this.handlePos.x;
        clipped.y = this.handlePos.y;
        if (clipped.x < 0) clipped.x = 0;
        if (clipped.y < 0) clipped.y = 0;
        if (clipped.x > this.element.clientWidth) clipped.x = this.element.clientWidth;
        if (clipped.y > this.element.clientHeight) clipped.y = this.element.clientHeight;

        let normalized: Point = new Point();
        normalized.x = (this.center.x - clipped.x) * 100.0 / (this.element.clientWidth / 2.0);
        normalized.y = (this.center.y - clipped.y) * 100.0 / (this.element.clientHeight / 2.0);

        this.value = normalized;

        if (this.pot) {
            this.pot.style.left = '' + (clipped.x - (this.pot.clientWidth / 2.0)) + 'px';
            this.pot.style.top = '' + (clipped.y - (this.pot.clientHeight / 2.0)) + 'px';
        }
    }

    saveValue(): void {
        if (!this.workSpace) return;
        this.workSpace.beginTransaction();
        let key_x = this.name + "_x";
        this.workSpace.values[key_x] = Slider.numToString(this.value.x);

        let key_y = this.name + "_y";
        this.workSpace.values[key_y] = Slider.numToString(this.value.y);
        this.workSpace.endTransaction();
    }

    loadValue(key: string, value: string): void {
        if (this.pressed == true) return;
        let key_x = this.name + "_x";
        let key_y = this.name + "_y";
        let refresh: boolean = false;
        if (key == key_x) {
            this.value.x = <any>value;
            refresh = true;
        }
        if (key == key_y) {
            this.value.y = <any>value;
            refresh = true;
        }
        if (refresh == true) {
            this.initLayout();
        }
    }

    initLayout(): void {

        this.center.x = this.element.clientWidth / 2;
        this.center.y = this.element.clientHeight / 2;

        let x = this.element.clientWidth / 2.0;
        let y = this.element.clientHeight / 2.0;

        this.handlePos.x = this.center.x - this.value.x * x / 100.0;
        this.handlePos.y = this.center.y - this.value.y * y / 100.0;

        this.handle.style.left = '' + (this.handlePos.x - (this.handle.clientWidth / 2)) + 'px';
        this.handle.style.top = '' + (this.handlePos.y - (this.handle.clientHeight / 2)) + 'px';

        if (this.pot) {
            this.pot.style.left = '' + (this.handlePos.x - (this.pot.clientWidth / 2.0)) + 'px';
            this.pot.style.top = '' + (this.handlePos.y - (this.pot.clientHeight / 2.0)) + 'px';
        }

    }

    private static numToString(n: number): string {
        return (Math.round(n * 100.0) / 100.0).toString(10);
    }

    static pointFromMouseEvent(container: HTMLElement, e: any): Point {
        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;
        //get mouse position on document crossbrowser
        if (!e) { e = window.event; }
        if (e.pageX || e.pageY) {
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        //get parent element position in document
        if (container.offsetParent) {
            do {
                e_posx += container.offsetLeft;
                e_posy += container.offsetTop;
            } while (container = <any>container.offsetParent);
        }
        // mouse position minus elm position is mouseposition relative to element:
        var pt = new Point();
        pt.x = (m_posx - e_posx);
        pt.y = (m_posy - e_posy);
        return pt;

    }

    static pointFromTouch(container: HTMLElement, e: Touch): Point {

        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;
        //get mouse position on document crossbrowser
        //if (!e) { e = window.event; }
        if (e.pageX || e.pageY) {
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        //get parent element position in document
        if (container.offsetParent) {
            do {
                e_posx += container.offsetLeft;
                e_posy += container.offsetTop;
            } while (container = <any>container.offsetParent);
        }
        // mouse position minus elm position is mouseposition relative to element:
        var pt = new Point();
        pt.x = (m_posx - e_posx);
        pt.y = (m_posy - e_posy);
        return pt;

    }

}