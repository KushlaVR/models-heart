class PropertyEditor {

    frame: ComponentFrame = null;
    element: HTMLElement;
    config: BaseConfig;
    fields: Array<Property> = new Array<Property>();

    PropertyWindow: HTMLElement = null;
    PropertyWinodwBody: HTMLElement = null;

    private static readonlyProperties = ["type"];
    private static PropertySelectors = {
        src: {
            Invoke: (element: HTMLElement) => {
                ImageSelector.Show(element);
            }
        }
    }

    public Show(frame: ComponentFrame) {
        if (this.frame != null) {
            this.Hide();
        }
        if (this.PropertyWinodwBody == null) {
            this.PropertyWinodwBody = document.createElement("div");
            this.PropertyWindow = Utils.CreateModalDialog("Properties", this.PropertyWinodwBody, () => { this.Save_Click(); });
        }
        this.frame = frame;
        this.element = frame.element;
        this.config = (<HTMLElementWithConfig><any>(this.element)).Config;
        console.log(this.config);
        this.PropertyWinodwBody.innerHTML = "";
        this.fields = new Array<Property>();
        for (var key in this.config) {


            let inputGroup = document.createElement("DIV")
            inputGroup.classList.add("input-group");
            inputGroup.classList.add("my-2");

            let preffix = document.createElement("DIV")
            preffix.classList.add("input-group-prepend");
            inputGroup.appendChild(preffix);

            let span = document.createElement("SPAN")
            span.classList.add("input-group-text");
            span.style.width = "120px";
            span.innerText = key;
            preffix.appendChild(span);

            let input: HTMLElement;
            if (PropertyEditor.readonlyProperties.indexOf(key) == -1) {//regular field
                input = document.createElement("INPUT");
                input.classList.add("form-control");
                input.setAttribute("Name", key);
                if (key == "color")
                    input.setAttribute("type", "color");
                else
                    input.setAttribute("type", "text");
                input.setAttribute("value", this.config[key]);
                inputGroup.appendChild(input);
                if (PropertyEditor.PropertySelectors[key]) {
                    let btnDiv: HTMLElement = document.createElement("DIV");
                    btnDiv.classList.add("input-group-append");
                    let btn = document.createElement("BUTTON");
                    btn.classList.add("btn");
                    btn.classList.add("btn-outline-secondary");
                    btn.innerText = "Select";
                    btn.onclick = () => {
                        PropertyEditor.PropertySelectors[key].Invoke(input);
                    };
                    btnDiv.appendChild(btn);
                    inputGroup.appendChild(btnDiv);
                }

            } else {//readonly field
                input = document.createElement("SPAN");
                input.classList.add("form-control");
                input.innerText = this.config[key];
                inputGroup.appendChild(input);
                input = null;
            }

            this.PropertyWinodwBody.appendChild(inputGroup);

            this.fields.push({
                name: key,
                context: this.config,
                input: input
            });
        }
        //console.log(this.fields);
        (<any>$(this.PropertyWindow)).modal({ backdrop: 'static' });

    }
    Save_Click() {
        console.log(this.config);
        for (let i: number = 0; i < this.fields.length; i++) {
            let fld = this.fields[i];
            if (fld.input != null) {
                this.config[fld.name] = $(fld.input).val();
            }
        }
        Utils.ApplyDimentionsProperties(this.element, this.config);
        Utils.ApplyTextProperty(this.element, this.config);
        if (this.config.type == "progress") {
            Utils.ApplyProgressProperties(this.element, <any>this.config);
        }
        this.frame.UpdateLayout();
        //console.log("save");
        (<any>$(this.PropertyWindow)).modal('hide');

    }

    public Hide() {
        console.log("hide");
    }

}
