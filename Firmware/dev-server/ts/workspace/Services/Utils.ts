
class Utils {

    static CreateSpinner(): HTMLElement {
        let ret = document.createElement("DIV");
        ret.classList.add("spinner-border");
        ret.classList.add("text-primary");
        ret.innerHTML = '<span class="sr-only">Loading...</span>'
        return ret;
    }

    static CreateGrid(sz: Point): HTMLElement {
        let div: HTMLDivElement = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = "0";
        div.style.top = "0";
        div.style.width = `${sz.x}vw`;
        div.style.height = `${sz.y}vw`;
        div.style.background = "conic-gradient(from 90deg at 0.05vw 0.05vw, rgba(0, 0, 0, 0) 90deg, rgba(1,1,1,0.1) 0deg) 0px 0px / 1vw 1vw";
        return div;
    }

    static ApplyDimentionsProperties(div: HTMLElement, source: BaseConfig) {
        div.style.position = "absolute"
        if (source.x) div.style.left = `${source.x}vw`;
        if (source.y) div.style.top = `${source.y}vw`;
        if (source.w) div.style.width = `${source.w}vw`;
        if (source.h) div.style.height = `${source.h}vw`;
    }

    static ApplyTextProperty(div: HTMLElement, source: BaseConfig) {
        if (source.type == "image") {
            div.setAttribute("src", (<ImageConfig>source).src)
            div.setAttribute("alt", source.text)
        }
        else if (source.type == "button") {
            div.innerText = source.text;
        }
        else if (source.type == "progress") {
            return;
        }
        else if (source.type == "slider") {
            return;
        }
        else if (source.type == "toggle") {
            Utils.InitToggleElement(div, <any>source);
        }
        else {
            div.innerText = source.text;
        }
    }

    static GetBG(el: HTMLElement): string {
        let ret: string = el.style.backgroundImage;
        while (ret.indexOf('"') >= 0) ret = ret.replace('"', "'")
        return ret;
    }

    static GetConfig(element: HTMLElement): BaseConfig {
        let cfg = (<HTMLElementWithConfig><any>element).Config;
        if (element.style.left) cfg.x = Utils.IntFromVw(element.style.left);
        if (element.style.top) cfg.y = Utils.IntFromVw(element.style.top);
        if (element.style.width) cfg.w = Utils.IntFromVw(element.style.width);
        if (element.style.height) cfg.h = Utils.IntFromVw(element.style.height);
        return cfg;
    }

    static IntFromVw(vw: string): number {
        return +(vw.substring(0, vw.length - 2));
    }


    static CreateModalDialog(title: string, content: HTMLElement, SaveClick): HTMLElement {
        let div = document.createElement("DIV");
        div.classList.add("modal");
        div.classList.add("fade");
        div.setAttribute("role", "dialog");

        let dialog = document.createElement("DIV");
        dialog.classList.add("modal-dialog");
        div.appendChild(dialog);

        let dialog_content = document.createElement("DIV");
        dialog_content.classList.add("modal-content");
        dialog.appendChild(dialog_content);

        let dialog_Header = document.createElement("DIV");
        dialog_Header.classList.add("modal-header")
        dialog_Header.innerHTML = (`<h5>${title}</h5>`);
        dialog_content.appendChild(dialog_Header);

        let dialog_Body = document.createElement("DIV");
        dialog_Body.classList.add("modal-body");
        dialog_Body.appendChild(content);
        dialog_content.appendChild(dialog_Body);


        let dialog_Footer = document.createElement("DIV");
        dialog_Footer.classList.add("modal-footer");

        let btnSave = Utils.CreateButton("Save");
        btnSave.classList.add("btn-primary");
        btnSave.addEventListener("click", SaveClick)
        dialog_Footer.appendChild(btnSave);

        let btnCancel = Utils.CreateButton("Cancel");
        btnCancel.classList.add("btn-secondary");
        btnCancel.setAttribute("data-dismiss", "modal");
        dialog_Footer.appendChild(btnCancel);
        dialog_content.appendChild(dialog_Footer);

        document.body.appendChild(div);

        return div;
    }


    static CreateButton(text: string): HTMLElement {
        let btn = document.createElement("BUTTON");
        btn.setAttribute("type", "button");
        btn.classList.add("btn");
        btn.innerText = text;
        return btn;
    }

    static InitToggleElement(div: HTMLElement, el: ToggleConfig) {
        div.innerHTML = "";

        let labels = el.text.split("|");
        let values = el.values.split("|");

        for (let i = 0; i < Math.max(labels.length, values.length); i++) {
            let lbl = document.createElement("LABEL");
            lbl.classList.add("btn");
            lbl.classList.add("btn-outline-primary");

            let input = document.createElement("INPUT");
            input.setAttribute("type", "radio");
            lbl.appendChild(input);

            let span = document.createElement("SPAN");
            lbl.appendChild(span);

            let v = "0";
            if (i < values.length) v = values[i];

            let s = "Off";
            if (i < labels.length) s = labels[i];

            input.setAttribute("value", v);
            span.innerText = s;

            div.appendChild(lbl);
        }
    }

    static SetTougleValue(div: HTMLElement, value: string) {

    }

}