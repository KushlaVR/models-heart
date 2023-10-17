/**
 * Author: kushlavr@gmail.com
 * */

class WorkSpace {

    private form: HTMLFormElement;

    client: string;

    eventSource: EventSource;

    private inputs: Array<Input> = new Array<Input>();
    private outputs: Array<Output> = new Array<Output>();
    private frames: Array<ComponentFrame> = new Array<ComponentFrame>();
    values: Dictionary<String> = new Dictionary<String>();
    sent: Dictionary<String> = new Dictionary<String>();
    tranCount: number = 0;
    timer: number = 0;
    reportInterval: number = 100;//Інтервал синхронізації даних
    fields: Array<string>;
    readonlyFields: Array<string> = new Array<string>();
    tran: number = 0;

    constructor(form: HTMLFormElement) {
        this.form = form;
        window.addEventListener('resize', (event: any) => this.UpdateLayout(), false);
        console.log("=== ***  Model's Heart  *** ===");
        console.log("===   kushlavr@gmail.com    ===");
    }

    public static init(form: JQuery) {
        var workSpace: WorkSpace = new WorkSpace(<any>(form[0]));
        workSpace.registerInputs();
        workSpace.registerOutputs();
        //workSpace.ConnectWS();
        workSpace.ConnectAPI();
    }

    public static build(form: JQuery, elementSource: string) {

        var workSpace: WorkSpace = new WorkSpace(<any>(form[0]));

        $.get(elementSource)
            .done(function (data) {
                workSpace.setupBg(data.bg);
                for (let el in data.elements) {
                    workSpace.createElement(data.elements[el]);
                }
                workSpace.registerInputs();
                workSpace.registerOutputs();
                //workSpace.ConnectWS();
                workSpace.ConnectAPI();
            })
            .fail(function () {
                console.log("error");
            });
    }

    public static design(form: JQuery, elementSource: string) {

        var workSpace: WorkSpace = new WorkSpace(<any>(form[0]));

        $.get(elementSource)
            .done(function (data) {
                workSpace.setupBg(data.bg);
                workSpace.createGrid(100, 45);
                for (let el in data.elements) {
                    workSpace.createElement(data.elements[el]);
                }
                workSpace.createConmponentsFrames();
            })
            .fail(function () {
                console.log("error");
            });
    }


    setupBg(bgUrl: string) {
        this.form.style.backgroundImage = bgUrl;
        this.form.style.backgroundSize = "cover";
    }


    private gridSize = new Point();
    createGrid(w: number, h: number) {
        this.gridSize.x = w;
        this.gridSize.y = h;
        let div: HTMLDivElement = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = "0";
        div.style.top = "0";
        div.style.width = `${w}vw`;
        div.style.height = `${h}vw`;
        div.style.background = "conic-gradient(from 90deg at 0.05vw 0.05vw, rgba(0, 0, 0, 0) 90deg, rgba(1,1,1,0.1) 0deg) 0px 0px / 1vw 1vw";
        this.form.appendChild(div);

    }

    getPixelPerVW(): Point {
        let ret = new Point();
        ret.x = this.form.clientWidth / this.gridSize.x;
        ret.y = this.form.clientHeight / this.gridSize.y;
        return ret;
    }

    createElement(el: BaseConfig) {
        if (el.type == "text") {
            this.createTextElement(<any>el);
        }
        if (el.type == "button") {
            this.createButtonElement(<any>el);
        }
        if (el.type == "slider") {
            this.createSliderElement(<any>el);
        }
    }

    createSliderElement(el: SliderConfig) {

        let div = document.createElement("DIV");
        div.setAttribute("href", "#");
        div.classList.add("slider");
        div.classList.add("input");
        div.setAttribute("name", el.cmd);
        div.style.position = "absolute"
        if (el.x) div.style.left = `${el.x}vw`;
        if (el.y) div.style.top = `${el.y}vw`;
        if (el.w) div.style.width = `${el.w}vw`;
        if (el.h) div.style.height = `${el.h}vw`;

        let pot = document.createElement("DIV");
        pot.classList.add("pot");

        let handle = document.createElement("DIV");
        handle.classList.add("handle");
        if (el.color)
            handle.classList.add(el.color);
        if (el.autocenter == "1")
            div.setAttribute("data-center", "1")
        if (el.autocenter == "x")
            div.setAttribute("data-center-x", "1")
        if (el.autocenter == "y")
            div.setAttribute("data-center-y", "1")

        div.appendChild(pot);
        div.appendChild(handle);
        this.form.appendChild(div);
    }

    createButtonElement(el: ButtonConfig) {

        let div = document.createElement("A");
        div.setAttribute("href", "#");
        div.classList.add("btn");
        div.classList.add("btn-primary");
        div.classList.add("input");
        div.innerText = el.text;
        div.setAttribute("name", el.cmd);
        div.style.position = "absolute"
        if (el.x) div.style.left = `${el.x}vw`;
        if (el.y) div.style.top = `${el.y}vw`;
        if (el.w) div.style.width = `${el.w}vw`;
        if (el.h) div.style.height = `${el.h}vw`;

        this.form.appendChild(div);
    }

    createTextElement(el: TextConfig) {

        let div = document.createElement("LABEL");
        div.innerText = el.text;
        div.style.position = "absolute"
        if (el.x) div.style.left = `${el.x}vw`;
        if (el.y) div.style.top = `${el.y}vw`;
        if (el.w) div.style.width = `${el.w}vw`;
        if (el.h) div.style.height = `${el.h}vw`;

        this.form.appendChild(div);
    }

    private ConnectAPI(): void {
        $.get("/api/EventSourceName")
            .done((EventSourceName) => {
                if (window.EventSource) {
                    var s: string = EventSourceName;
                    var json: string = decodeURI(s.substring(s.indexOf("?") + 1)).replace("%3a", ":");
                    var parcel: any = JSON.parse(json);
                    this.client = parcel.client;
                    this.eventSource = new EventSource(EventSourceName);
                    this.eventSource.onopen = (ev: Event) => {
                        this.setFormat();
                        this.sendData();
                    }
                    this.eventSource.onmessage = (msg: MessageEvent) => {
                        $("#message").text(msg.data);
                        this.receiveData(msg);
                    };
                    this.eventSource.onerror = (event: Event) => {
                        $("#message").text("Error...");
                    };
                }
            })
            .fail(() => {
                $("#message").text("error");
            });
    }

    /** 
     *  Повідомляємо серверу в якій послідовності розміщено значення елементів керування
     */
    private setFormat(): void {
        this.fields = new Array();
        $.each(<any>(this.values), (name: string, value: string) => {
            this.fields.push(name);
        });

        this.send(JSON.stringify({ client: this.client, fields: this.fields, readonlyFields: this.readonlyFields }));
    }

    private _readyToSend: boolean = true;
    private readyToSend(): boolean {
        if (this.eventSource)
            return this._readyToSend;
        return false;
    }

    private send(value: string): void {
        if (this.eventSource) {
            this._readyToSend = false;
            $.ajax({
                url: "/api/post",
                data: value,
                cache: false,
                type: 'POST',
                dataType: "json",
                contentType: 'application/json; charset=utf-8'
            }).done(() => {
                console.log("done!");
                this._readyToSend = true;
            }).fail(() => {
                console.log("fail!");
                this._readyToSend = true;
            });
        } //else
        //if (this.socket) {
        //    this._readyToSend = false;
        //    this.socket.send(value);
        //    this._readyToSend = true;
        //}
    }

    /**
     * Запускаємо механізм відправки повідомлень
     * */
    private sendData(): void {
        //Якщо таймер не заведено, відправляємо пакет і запускаємо таймер
        if (this.timer === 0) {
            if (this.readyToSend() == true) {
                var v = new Array<string>();
                var changed: boolean = false;
                for (var i: number = 0; i < this.fields.length; i++) {
                    var key: string = this.fields[i];
                    var value = this.values[key];
                    v.push(value);
                    if (this.sent[key] !== this.values[key]) changed = true;
                    this.sent[key] = value;
                }
                if (changed == true) {
                    this.tran += 1;
                    this.send(JSON.stringify({ client: this.client, tran: this.tran.toString(), values: v }));
                }
            }

            this.timer = setTimeout(() => {
                this.timer = 0;
                this.sendData();
            }, this.reportInterval);
        }
    }

    /**
     * Розбирає отримані по сокету дані
     * @param msg те що прийшло по сокету
     */
    private receiveData(msg: MessageEvent): void {
        if (msg.data) {
            var parcel = JSON.parse(msg.data);
            if (this.tran < parcel.tran) {
                this.tran = parseInt(parcel.tran, 10);
                for (let i: number = 0; i < this.fields.length; i++) {
                    let key = this.fields[i];
                    let val = parcel.values[i];
                    if (this.sent[key] != val) {
                        this.sent[key] = val;
                        this.values[key] = val;
                        this.refreshInput(key, val);
                    }
                }
            } else {
                //відповідь на нашу посилку
                //Поновляємо всі readonly поля
                for (let i: number = 0; i < this.fields.length; i++) {
                    let key = this.fields[i];
                    let val = parcel.values[i];
                    for (let rIndex: number = 0; rIndex < this.readonlyFields.length; rIndex++) {
                        if (key == this.readonlyFields[rIndex]) {
                            this.sent[key] = val;
                            this.values[key] = val;
                            break;
                        }
                    }
                }
            }
            this.refreshOutput();
        }
    }

    /**
     * Включити/виключити повноекранний режим
     * */
    static toggleFullScreen(): void {
        let doc: any = window.document;
        let docEl: any = doc.documentElement;

        var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        }
        else {
            cancelFullScreen.call(doc);
        }
    }

    /**
     * Проводить повторну ініціалізацію елементів у відповідності до нових розмірів екрану
     */
    UpdateLayout() {
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].initLayout();
        }
        for (let o = 0; o < this.outputs.length; o++) {
            this.outputs[o].initLayout();
        }
        for (let o = 0; o < this.frames.length; o++) {
            this.frames[o].UpdateLayout();
        }
    }

    /**
     * ініціалізує та реєструє всі елементи керування
     */
    private registerInputs() {
        var inputs = $(".input", this.form);

        inputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            var input: Input;
            if ($(element).hasClass("slider")) {
                input = new Slider(element);
            } else if ($(element).hasClass("btn")) {
                input = new Button(element);
            } else {
                input = new Input(element);
            }
            this.addInput(input);
        })
    }

    private addInput(input: Input): void {
        input.workSpace = this;
        this.inputs.push(input);
        input.saveValue();
    }

    /**
     * Ініціалізує та реєструє всі поля виводу інформації
     * */
    private registerOutputs() {
        var outputs = $(".output", this.form);

        outputs.each((index: number, val: any) => {
            let output: Output = null;
            output = new Output(val);
            if (!(this.values[output.name] != undefined)) {
                //Поле не зареєстроване, значить воно Readonly
                this.readonlyFields.push(output.name);
                this.values[output.name] = 0;
            }
            this.addOutput(output);
        })
    }

    private addOutput(output: Output): void {
        output.workSpace = this;
        this.outputs.push(output);
        output.loadValue();
    }

    /**
     * Розпочинає трансакцію вводу/виводу
     * */
    beginTransaction() {
        this.tranCount += 1;
    }


    /**
     * Закінчує трансакцію вводу/виводу
     * Під час закінчення трансакції - надсилається поточний стан
     * */
    endTransaction() {
        this.tranCount -= 1;
        if (this.tranCount === 0) {
            for (var i: number = 0; i < this.outputs.length; i++) {
                this.outputs[i].loadValue();
            }
        }
    }


    /**
     * Проставляє в елемент керування прийняте значення
     * @param key назва значення
     * @param value значення
     */
    private refreshInput(key: string, value: string): void {
        for (var i: number = 0; i < this.inputs.length; i++) {
            this.inputs[i].loadValue(key, value);
        }
    }

    /**
    * Проставляє в поля прийняті значення
    */
    private refreshOutput(): void {
        for (var i: number = 0; i < this.outputs.length; i++) {
            this.outputs[i].loadValue();
        }
    }


    private addConponentFrame(frame: ComponentFrame): void {
        frame.Workspace = this;
        this.frames.push(frame);
    }


    private createConmponentsFrames(): void {
        var inputs = $(".input", this.form);

        inputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            var frame: ComponentFrame = new ComponentFrame(element);
            this.addConponentFrame(frame);
        })
    }
}

class Input {

    workSpace: WorkSpace;
    element: HTMLElement;
    jElement: JQuery;
    name: string;

    constructor(element: any) {
        this.element = element;
        this.jElement = $(element);
        this.name = this.jElement.attr("name");
    }

    saveValue(): void {
        if (!this.workSpace) return;
        this.workSpace.beginTransaction();
        let val: string = this.jElement.attr("value")
        if (val) {
            this.workSpace.values[this.name] = val;
        }
        this.workSpace.endTransaction();
    }

    loadValue(key: string, value: string): void {
        if (key == this.name) {
            this.jElement.attr("value", value);
        }
    }

    initLayout(): void {
        console.log("Input.Init layout");
    }
}