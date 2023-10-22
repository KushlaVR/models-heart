﻿class PropertyEditor {

    frame: ComponentFrame = null;
    element: HTMLElement;
    config: BaseConfig;
    fields: Array<Property> = new Array<Property>();

    PropertyWindow: HTMLElement = null;
    PropertyWinodwBody: HTMLElement = null;

    private static readonlyProperties = ["type"];


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

        this.PropertyWinodwBody.innerHTML = "";
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
            if (PropertyEditor.readonlyProperties.indexOf(key) == -1) {
                input = document.createElement("INPUT");
                input.classList.add("form-control");
                input.setAttribute("Name", key);
                input.setAttribute("type", "text");
                input.setAttribute("value", this.config[key]);
                inputGroup.appendChild(input);
            } else {
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
        for (let i: number = 0; i < this.fields.length; i++) {
            let fld = this.fields[i];
            if (fld.input != null) {
                this.config[fld.name] = $(fld.input).val();
            }
        }
        Utils.ApplyDimentionsProperties(this.element, this.config);
        Utils.ApplyTextProperty(this.element, this.config);
        this.frame.UpdateLayout();
        //console.log("save");
        (<any>$(this.PropertyWindow)).modal('hide');

    }

    public Hide() {
        console.log("hide");
    }

}
