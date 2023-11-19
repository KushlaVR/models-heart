class Switch extends Input {

    value: number = 0;

    constructor(element: HTMLElement) {
        super(element);
        this.SetupEvents();
    }

    SetupEvents() {
        let jEl = $(this.element);
        let el = jEl[0];
        el.addEventListener("change", (event) => this.OnClick(), false);
    }

    OnClick() {
        console.log(this.element);
        let jEl = $(this.element);
        let el: HTMLInputElement = <any>jEl[0];
        let key = this.name;
        if (el.checked) {
            this.value = 1;
        } else {
            this.value = 0;
        }
        this.saveValue();
    }

    loadValue(key: string, value: string): void {
        let refresh: boolean = false;
        if (key == this.name) {
            this.value = <any>value;
            refresh = true;
        }
        if (refresh == true) {
            this.initLayout();
        }
    }

    saveValue(): void {
        if (!this.workSpace) return;
        this.workSpace.beginTransaction();
        let key = this.name;
        this.workSpace.values[key] = Slider.numToString(this.value);
        this.workSpace.endTransaction();
    }

    initLayout(): void {
        let el: HTMLInputElement = <any>this.element;
        el.checked = !(this.value == 0)
    }
}