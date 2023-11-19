class Toggle extends Input {

    pressed: string;



    constructor(element: any) {
        super(element);

        this.SetupEvents();
    }

    SetupEvents() {
        $(".btn", this.element).each((index, el) => {

            if ("ontouchstart" in document.documentElement) {
                el.addEventListener('touchstart', (event: MouseEvent) => this.onTouchStart(el, event), false);
                el.addEventListener('touchend', (event: MouseEvent) => this.onTouchEnd(el, event), false);
            }
            else {
                el.addEventListener('mousedown', (event: MouseEvent) => this.onMouseDown(el, event), false);
                el.addEventListener('mouseup', (event: MouseEvent) => this.onMouseUp(el, event), false);
            }
        });
    }

    private onTouchStart(el: HTMLElement, event: MouseEvent): void {
        //console.log(el);
        this.pressed = this.GetElementValue(el);
        this.saveValue();
        this.workSpace.refreshInput(this.name, this.pressed);
        event.preventDefault();
    }

    private onTouchEnd(el: HTMLElement, event: MouseEvent): void {
        event.preventDefault();
    }

    private onMouseDown(el: HTMLElement, event: MouseEvent): void {
        //console.log(el);
        this.pressed = this.GetElementValue(el);
        this.saveValue();
        this.workSpace.refreshInput(this.name, this.pressed);
        event.preventDefault();
    }

    private onMouseUp(el: HTMLElement, event: MouseEvent): void {
        event.preventDefault();
    }

    saveValue(): void {
        if (!this.workSpace) return;
        this.workSpace.beginTransaction();
        let key = this.name;
        this.workSpace.values[key] = this.pressed;
        this.workSpace.endTransaction();
    }

    loadValue(key: string, value: string): void {
        let refresh: boolean = false;
        if (key == this.name) {
            $(".btn", this.element).each((index, el) => {
                if (this.GetElementValue(el) == value) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            });
        }
    }


    GetElementValue(el: HTMLElement): string {
        let input = $("input", el)[0];
        return input.getAttribute("value");
    }

}