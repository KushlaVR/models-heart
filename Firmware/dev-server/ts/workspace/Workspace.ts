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
                workSpace.RegisterToolbox();
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

    RegisterToolbox() {
        let buttons = $("[data-command]");
        buttons.each((index: number, val: any) => {
            let element: HTMLElement = val;
            element.addEventListener('click', (event: any) => this.CommandButton(element), false);
        })
    }

    CommandButton(element: HTMLElement) {
        this.ExecuteCommand(element.getAttribute("data-command"));
    }

    public ExecuteCommand(command: string) {
        let element: HTMLElement;

        if (command === "add-text") {
            element = this.createElement(<TextConfig>{
                text: "New text element",
                cmd: "",
                type: "text",
                x: 0,
                y: 0,
                w: 20,
                h: 4
            });
        } else if (command === "add-button") {
            element = this.createElement(<ButtonConfig>{
                text: "button",
                cmd: "button",
                type: "button",
                x: 0,
                y: 0,
                w: 20,
                h: 5
            });
        }
        else if (command === "add-slider") {
            element = this.createElement(<SliderConfig>{
                cmd: "slider",
                type: "slider",
                x: 0,
                y: 0,
                w: 40,
                h: 8,
                autocenter: "1",
                color: "red"
            });
        }
        else if (command === "add-progress") {
            element = this.createElement(<ProgressConfig>{
                cmd: "progress",
                type: "progress",
                x: 0,
                y: 0,
                w: 40,
                h: 4
            });
        }
        else if (command === "add-image") {
            element = this.createElement(<ImageConfig>{
                text: null,
                cmd: "image",
                type: "image",
                x: 0,
                y: 0,
                w: 10,
                h: 10,
                src: "img/green.png"
            });
        }
        else if (command === "add-toggle") {
            element = this.createElement(<ToggleConfig>{
                text: "Off|A|B|C",
                values: "0|10|50|100",
                cmd: "toggle",
                type: "toggle",
                x: 0,
                y: 0,
                w: 20,
                h: 4,
            });
        }
        else if (command === "delete") {
            this.DeleteCurrentElement();
            return;
        }
        else if (command === "save") {
            this.SaveWorkspace();
            return;
        }
        else if (command === "edit") {
            this.EditCurrentElement();
            return;
        }
        else {
            console.log(command);
            return;
        }

        var frame: ComponentFrame = new ComponentFrame(element);
        this.addConponentFrame(frame);

    }

    setupBg(bgUrl: string) {
        this.form.style.backgroundImage = bgUrl;
        this.form.style.backgroundSize = "cover";
    }


    private gridSize = new Point();
    createGrid(w: number, h: number) {
        this.gridSize.x = w;
        this.gridSize.y = h;
        this.form.appendChild(Utils.CreateGrid(this.gridSize));

    }

    getPixelPerVW(): Point {
        let ret = new Point();
        ret.x = this.form.clientWidth / this.gridSize.x;
        ret.y = this.form.clientHeight / this.gridSize.y;
        return ret;
    }

    createElement(el: BaseConfig): HTMLElement {
        if (el.type == "text") {
            return this.createTextElement(<any>el);
        }
        if (el.type == "progress") {
            return this.createProgressElement(<any>el);
        }
        if (el.type == "button") {
            return this.createButtonElement(<any>el);
        }
        if (el.type == "slider") {
            return this.createSliderElement(<any>el);
        }
        if (el.type == "image") {
            return this.createImageElement(<any>el);
        }
        if (el.type == "toggle") {
            return this.createToggleElement(<any>el);
        }
    }

    createSliderElement(el: SliderConfig): HTMLElement {

        let div = document.createElement("DIV");
        div.setAttribute("href", "#");
        div.classList.add("slider");
        div.classList.add("input");
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);

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
        (<any>div).Config = el;
        return div;
    }

    createButtonElement(el: ButtonConfig): HTMLElement {

        let div = document.createElement("BUTTON");
        div.setAttribute("type", "button");
        div.classList.add("btn");
        div.classList.add("btn-primary");
        div.classList.add("input");
        div.innerText = el.text;
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);
        this.form.appendChild(div);
        (<any>div).Config = el;
        return div;
    }

    createTextElement(el: TextConfig): HTMLElement {

        let div = document.createElement("LABEL");
        div.innerText = el.text;
        div.classList.add("output");
        Utils.ApplyDimentionsProperties(div, el);
        this.form.appendChild(div);
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        (<HTMLElementWithConfig><any>div).Config = el;
        return div;
    }

    createImageElement(el: ImageConfig): HTMLElement {
        let div = document.createElement("IMG");
        div.innerText = el.text;
        div.classList.add("output");
        Utils.ApplyDimentionsProperties(div, el);
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        if (el.src) div.setAttribute("src", el.src);

        this.form.appendChild(div);
        (<HTMLElementWithConfig><any>div).Config = el;
        return div;
    }

    createProgressElement(el: BaseConfig): HTMLElement {

        let div = document.createElement("DIV");
        div.classList.add("output");
        div.classList.add("progress");
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        Utils.ApplyDimentionsProperties(div, el);

        let progressBar = document.createElement("DIV");
        progressBar.classList.add("progress-bar");
        progressBar.style.width = "50%"
        div.appendChild(progressBar);

        this.form.appendChild(div);
        (<HTMLElementWithConfig><any>div).Config = el;
        return div;
    }

    createToggleElement(el: ToggleConfig): HTMLElement {
        /**
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <label class="btn btn-secondary active">
            <input type="radio" name="options" id="option1" autocomplete="off" checked> Active
          </label>
          <label class="btn btn-secondary">
            <input type="radio" name="options" id="option2" autocomplete="off"> Radio
          </label>
          <label class="btn btn-secondary">
            <input type="radio" name="options" id="option3" autocomplete="off"> Radio
          </label>
        </div>
        */

        let div = document.createElement("DIV");
        div.classList.add("input");
        div.classList.add("toggle");
        div.classList.add("btn-group");
        div.classList.add("btn-group-toggle");
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);

        Utils.InitToggleElement(div, el);
        
        this.form.appendChild(div);
        (<HTMLElementWithConfig><any>div).Config = el;
        return div;

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
            } else if ($(element).hasClass("toggle")) {
                input = new Toggle(element);
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
    public refreshInput(key: string, value: string): void {
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


    private createConmponentsFrames(): void {
        var inputs = $(".input", this.form);

        inputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            var frame: ComponentFrame = new ComponentFrame(element);
            this.addConponentFrame(frame);
        })

        var outputs = $(".output", this.form);

        outputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            var frame: ComponentFrame = new ComponentFrame(element);
            this.addConponentFrame(frame);
        })
    }

    private addConponentFrame(frame: ComponentFrame): void {
        frame.Workspace = this;
        this.frames.push(frame);
    }

    currentFrame: ComponentFrame = null;
    PropertyEditor: PropertyEditor = null;
    SetCurrentFrame(frame: ComponentFrame) {
        if (this.currentFrame != null) {
            this.currentFrame.Hide();
        }
        this.currentFrame = frame;
        if (this.currentFrame != null) {
            this.currentFrame.Show();
        }
    }

    DeleteCurrentElement() {
        if (this.currentFrame == null) return;
        const div = this.currentFrame.element;
        const index = this.frames.indexOf(this.currentFrame, 0);
        if (index > -1) {
            this.frames.splice(index, 1);
            this.form.removeChild(this.currentFrame.frameDiv);
            this.form.removeChild(div);
            this.currentFrame = null
        }
    }

    EditCurrentElement() {
        if (this.currentFrame == null) return;
        if (this.PropertyEditor == null) {
            this.PropertyEditor = new PropertyEditor();
        }
        this.PropertyEditor.Show(this.currentFrame);
    }

    private _bg_Loading: HTMLElement = null;

    SaveWorkspace() {
        if (this._bg_Loading == null) {
            this._bg_Loading = document.createElement("DIV");
            this._bg_Loading.classList.add("loading");
            this._bg_Loading.classList.add("fade");
            this._bg_Loading.appendChild(Utils.CreateSpinner());
            document.body.appendChild(this._bg_Loading)
        }
        this._bg_Loading.classList.add("show");
        this._bg_Loading.style.display = "block"
        const uiFileLocation = "/"
        var formData = new FormData();
        formData.append('file', new File([this.SerializeWorkspace()], "ui.json"));
        $.ajax({
            url: '/api/dir?path=' + uiFileLocation,
            type: 'POST',
            data: formData,
            processData: false,  // tell jQuery not to process the data
            contentType: false,  // tell jQuery not to set contentType
            statusCode: {
                200: (data) => {
                    this._bg_Loading.classList.remove("show");
                    this._bg_Loading.style.display = "none"
                    console.log("Saved");
                }
            }
        })
    }

    SerializeWorkspace(): string {
        let elements = new Array<BaseConfig>();

        var inputs = $(".input", this.form);
        inputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            elements.push(Utils.GetConfig(element));
        })

        var outputs = $(".output", this.form);
        outputs.each((index: number, val: any) => {
            let element: HTMLElement = val;
            elements.push(Utils.GetConfig(element));
        })

        let ret = {
            bg: Utils.GetBG(this.form),
            elements: elements
        }
        //console.log(ret);
        return JSON.stringify(ret);
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