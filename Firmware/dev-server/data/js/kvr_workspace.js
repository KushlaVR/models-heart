var Dictionary = (function () {
    function Dictionary(init) {
        if (init) {
            for (var x = 0; x < init.length; x++) {
                this[init[x].key] = init[x].value;
            }
        }
    }
    return Dictionary;
}());
var Point = (function () {
    function Point(x, y) {
        this.x = 0;
        this.y = 0;
        if (x)
            this.x = x;
        if (y)
            this.y = y;
    }
    Point.prototype.Round = function (grid) {
        var ret = new Point();
        ret.x = Math.round(this.x / grid.x) * grid.x;
        ret.y = Math.round(this.y / grid.y) * grid.y;
        return ret;
    };
    return Point;
}());
;
var WorkSpace = (function () {
    function WorkSpace(form) {
        var _this = this;
        this.inputs = new Array();
        this.outputs = new Array();
        this.frames = new Array();
        this.values = new Dictionary();
        this.sent = new Dictionary();
        this.tranCount = 0;
        this.timer = 0;
        this.reportInterval = 100;
        this.readonlyFields = new Array();
        this.tran = 0;
        this.gridSize = new Point();
        this._readyToSend = true;
        this.currentFrame = null;
        this.PropertyEditor = null;
        this._bg_Loading = null;
        this.form = form;
        window.addEventListener('resize', function (event) { return _this.UpdateLayout(); }, false);
        console.log("=== ***  Model's Heart  *** ===");
        console.log("===   kushlavr@gmail.com    ===");
    }
    WorkSpace.init = function (form) {
        var workSpace = new WorkSpace((form[0]));
        workSpace.registerInputs();
        workSpace.registerOutputs();
        workSpace.ConnectAPI();
    };
    WorkSpace.build = function (form, elementSource) {
        var workSpace = new WorkSpace((form[0]));
        $.get(elementSource)
            .done(function (data) {
            workSpace.setupBg(data.bg);
            for (var el in data.elements) {
                workSpace.createElement(data.elements[el]);
            }
            workSpace.registerInputs();
            workSpace.registerOutputs();
            workSpace.ConnectAPI();
        })
            .fail(function () {
            console.log("error");
        });
    };
    WorkSpace.design = function (form, elementSource) {
        var workSpace = new WorkSpace((form[0]));
        $.get(elementSource)
            .done(function (data) {
            workSpace.RegisterToolbox();
            workSpace.setupBg(data.bg);
            workSpace.createGrid(100, 45);
            for (var el in data.elements) {
                workSpace.createElement(data.elements[el]);
            }
            workSpace.createConmponentsFrames();
        })
            .fail(function () {
            console.log("error");
        });
    };
    WorkSpace.prototype.RegisterToolbox = function () {
        var _this = this;
        var buttons = $("[data-command]");
        buttons.each(function (index, val) {
            var element = val;
            element.addEventListener('click', function (event) { return _this.CommandButton(element); }, false);
        });
    };
    WorkSpace.prototype.CommandButton = function (element) {
        this.ExecuteCommand(element.getAttribute("data-command"));
    };
    WorkSpace.prototype.ExecuteCommand = function (command) {
        var element;
        if (command === "add-text") {
            element = this.createElement({
                text: "New text element",
                cmd: "",
                type: "text",
                x: 0,
                y: 0,
                w: 20,
                h: 4
            });
        }
        else if (command === "add-button") {
            element = this.createElement({
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
            element = this.createElement({
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
            element = this.createElement({
                cmd: "progress",
                type: "progress",
                x: 0,
                y: 0,
                w: 40,
                h: 4,
                color: "#AABBCC"
            });
        }
        else if (command === "add-image") {
            element = this.createElement({
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
            element = this.createElement({
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
        var frame = new ComponentFrame(element);
        this.addConponentFrame(frame);
    };
    WorkSpace.prototype.setupBg = function (bgUrl) {
        this.form.style.backgroundImage = bgUrl;
        this.form.style.backgroundSize = "cover";
    };
    WorkSpace.prototype.createGrid = function (w, h) {
        this.gridSize.x = w;
        this.gridSize.y = h;
        this.form.appendChild(Utils.CreateGrid(this.gridSize));
    };
    WorkSpace.prototype.getPixelPerVW = function () {
        var ret = new Point();
        ret.x = this.form.clientWidth / this.gridSize.x;
        ret.y = this.form.clientHeight / this.gridSize.y;
        return ret;
    };
    WorkSpace.prototype.createElement = function (el) {
        if (el.type == "text") {
            return this.createTextElement(el);
        }
        if (el.type == "progress") {
            return this.createProgressElement(el);
        }
        if (el.type == "button") {
            return this.createButtonElement(el);
        }
        if (el.type == "slider") {
            return this.createSliderElement(el);
        }
        if (el.type == "image") {
            return this.createImageElement(el);
        }
        if (el.type == "toggle") {
            return this.createToggleElement(el);
        }
    };
    WorkSpace.prototype.createSliderElement = function (el) {
        var div = document.createElement("DIV");
        div.setAttribute("href", "#");
        div.classList.add("slider");
        div.classList.add("input");
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);
        var pot = document.createElement("DIV");
        pot.classList.add("pot");
        var handle = document.createElement("DIV");
        handle.classList.add("handle");
        if (el.color)
            handle.classList.add(el.color);
        if (el.autocenter == "1")
            div.setAttribute("data-center", "1");
        if (el.autocenter == "x")
            div.setAttribute("data-center-x", "1");
        if (el.autocenter == "y")
            div.setAttribute("data-center-y", "1");
        div.appendChild(pot);
        div.appendChild(handle);
        this.form.appendChild(div);
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.createButtonElement = function (el) {
        var div = document.createElement("BUTTON");
        div.setAttribute("type", "button");
        div.classList.add("btn");
        div.classList.add("btn-primary");
        div.classList.add("input");
        div.innerText = el.text;
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);
        this.form.appendChild(div);
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.createTextElement = function (el) {
        var div = document.createElement("LABEL");
        div.innerText = el.text;
        div.classList.add("output");
        Utils.ApplyDimentionsProperties(div, el);
        this.form.appendChild(div);
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.createImageElement = function (el) {
        var div = document.createElement("IMG");
        div.innerText = el.text;
        div.classList.add("output");
        Utils.ApplyDimentionsProperties(div, el);
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        if (el.src)
            div.setAttribute("src", el.src);
        this.form.appendChild(div);
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.createProgressElement = function (el) {
        var div = document.createElement("DIV");
        div.classList.add("output");
        div.classList.add("progress");
        if (el.cmd) {
            div.setAttribute("data-input", el.cmd);
        }
        Utils.ApplyDimentionsProperties(div, el);
        var progressBar = document.createElement("DIV");
        progressBar.classList.add("progress-bar");
        if (el.color)
            progressBar.style.backgroundColor = "".concat(el.color);
        progressBar.style.width = "50%";
        div.appendChild(progressBar);
        this.form.appendChild(div);
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.createToggleElement = function (el) {
        var div = document.createElement("DIV");
        div.classList.add("input");
        div.classList.add("toggle");
        div.classList.add("btn-group");
        div.classList.add("btn-group-toggle");
        div.setAttribute("name", el.cmd);
        Utils.ApplyDimentionsProperties(div, el);
        Utils.InitToggleElement(div, el);
        this.form.appendChild(div);
        div.Config = el;
        return div;
    };
    WorkSpace.prototype.ConnectAPI = function () {
        var _this = this;
        $.get("/api/EventSourceName")
            .done(function (EventSourceName) {
            if (window.EventSource) {
                var s = EventSourceName;
                var json = decodeURI(s.substring(s.indexOf("?") + 1)).replace("%3a", ":");
                var parcel = JSON.parse(json);
                _this.client = parcel.client;
                _this.eventSource = new EventSource(EventSourceName);
                _this.eventSource.onopen = function (ev) {
                    _this.setFormat();
                    _this.sendData();
                };
                _this.eventSource.onmessage = function (msg) {
                    $("#message").text(msg.data);
                    _this.receiveData(msg);
                };
                _this.eventSource.onerror = function (event) {
                    $("#message").text("Error...");
                };
            }
        })
            .fail(function () {
            $("#message").text("error");
        });
    };
    WorkSpace.prototype.setFormat = function () {
        var _this = this;
        this.fields = new Array();
        $.each((this.values), function (name, value) {
            _this.fields.push(name);
        });
        this.send(JSON.stringify({ client: this.client, fields: this.fields, readonlyFields: this.readonlyFields }));
    };
    WorkSpace.prototype.readyToSend = function () {
        if (this.eventSource)
            return this._readyToSend;
        return false;
    };
    WorkSpace.prototype.send = function (value) {
        var _this = this;
        if (this.eventSource) {
            this._readyToSend = false;
            $.ajax({
                url: "/api/post",
                data: value,
                cache: false,
                type: 'POST',
                dataType: "json",
                contentType: 'application/json; charset=utf-8'
            }).done(function () {
                console.log("done!");
                _this._readyToSend = true;
            }).fail(function () {
                console.log("fail!");
                _this._readyToSend = true;
            });
        }
    };
    WorkSpace.prototype.sendData = function () {
        var _this = this;
        if (this.timer === 0) {
            if (this.readyToSend() == true) {
                var v = new Array();
                var changed = false;
                for (var i = 0; i < this.fields.length; i++) {
                    var key = this.fields[i];
                    var value = this.values[key];
                    v.push(value);
                    if (this.sent[key] !== this.values[key])
                        changed = true;
                    this.sent[key] = value;
                }
                if (changed == true) {
                    this.tran += 1;
                    this.send(JSON.stringify({ client: this.client, tran: this.tran.toString(), values: v }));
                }
            }
            this.timer = setTimeout(function () {
                _this.timer = 0;
                _this.sendData();
            }, this.reportInterval);
        }
    };
    WorkSpace.prototype.receiveData = function (msg) {
        if (msg.data) {
            var parcel = JSON.parse(msg.data);
            if (this.tran < parcel.tran) {
                this.tran = parseInt(parcel.tran, 10);
                for (var i = 0; i < this.fields.length; i++) {
                    var key = this.fields[i];
                    var val = parcel.values[i];
                    if (this.sent[key] != val) {
                        this.sent[key] = val;
                        this.values[key] = val;
                        this.refreshInput(key, val);
                    }
                }
            }
            else {
                for (var i = 0; i < this.fields.length; i++) {
                    var key = this.fields[i];
                    var val = parcel.values[i];
                    for (var rIndex = 0; rIndex < this.readonlyFields.length; rIndex++) {
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
    };
    WorkSpace.toggleFullScreen = function () {
        var doc = window.document;
        var docEl = doc.documentElement;
        var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        }
        else {
            cancelFullScreen.call(doc);
        }
    };
    WorkSpace.prototype.UpdateLayout = function () {
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].initLayout();
        }
        for (var o = 0; o < this.outputs.length; o++) {
            this.outputs[o].initLayout();
        }
        for (var o = 0; o < this.frames.length; o++) {
            this.frames[o].UpdateLayout();
        }
    };
    WorkSpace.prototype.registerInputs = function () {
        var _this = this;
        var inputs = $(".input", this.form);
        inputs.each(function (index, val) {
            var element = val;
            var input;
            if ($(element).hasClass("slider")) {
                input = new Slider(element);
            }
            else if ($(element).hasClass("toggle")) {
                input = new Toggle(element);
            }
            else if ($(element).hasClass("btn")) {
                input = new Button(element);
            }
            else {
                input = new Input(element);
            }
            _this.addInput(input);
        });
    };
    WorkSpace.prototype.addInput = function (input) {
        input.workSpace = this;
        this.inputs.push(input);
        input.saveValue();
    };
    WorkSpace.prototype.registerOutputs = function () {
        var _this = this;
        var outputs = $(".output", this.form);
        outputs.each(function (index, val) {
            var output = null;
            output = new Output(val);
            if (!(_this.values[output.name] != undefined)) {
                _this.readonlyFields.push(output.name);
                _this.values[output.name] = 0;
            }
            _this.addOutput(output);
        });
    };
    WorkSpace.prototype.addOutput = function (output) {
        output.workSpace = this;
        this.outputs.push(output);
        output.loadValue();
    };
    WorkSpace.prototype.beginTransaction = function () {
        this.tranCount += 1;
    };
    WorkSpace.prototype.endTransaction = function () {
        this.tranCount -= 1;
        if (this.tranCount === 0) {
            for (var i = 0; i < this.outputs.length; i++) {
                this.outputs[i].loadValue();
            }
        }
    };
    WorkSpace.prototype.refreshInput = function (key, value) {
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].loadValue(key, value);
        }
    };
    WorkSpace.prototype.refreshOutput = function () {
        for (var i = 0; i < this.outputs.length; i++) {
            this.outputs[i].loadValue();
        }
    };
    WorkSpace.prototype.createConmponentsFrames = function () {
        var _this = this;
        var inputs = $(".input", this.form);
        inputs.each(function (index, val) {
            var element = val;
            var frame = new ComponentFrame(element);
            _this.addConponentFrame(frame);
        });
        var outputs = $(".output", this.form);
        outputs.each(function (index, val) {
            var element = val;
            var frame = new ComponentFrame(element);
            _this.addConponentFrame(frame);
        });
    };
    WorkSpace.prototype.addConponentFrame = function (frame) {
        frame.Workspace = this;
        this.frames.push(frame);
    };
    WorkSpace.prototype.SetCurrentFrame = function (frame) {
        if (this.currentFrame != null) {
            this.currentFrame.Hide();
        }
        this.currentFrame = frame;
        if (this.currentFrame != null) {
            this.currentFrame.Show();
        }
    };
    WorkSpace.prototype.DeleteCurrentElement = function () {
        if (this.currentFrame == null)
            return;
        var div = this.currentFrame.element;
        var index = this.frames.indexOf(this.currentFrame, 0);
        if (index > -1) {
            this.frames.splice(index, 1);
            this.form.removeChild(this.currentFrame.frameDiv);
            this.form.removeChild(div);
            this.currentFrame = null;
        }
    };
    WorkSpace.prototype.EditCurrentElement = function () {
        if (this.currentFrame == null)
            return;
        if (this.PropertyEditor == null) {
            this.PropertyEditor = new PropertyEditor();
        }
        this.PropertyEditor.Show(this.currentFrame);
    };
    WorkSpace.prototype.SaveWorkspace = function () {
        var _this = this;
        if (this._bg_Loading == null) {
            this._bg_Loading = document.createElement("DIV");
            this._bg_Loading.classList.add("loading");
            this._bg_Loading.classList.add("fade");
            this._bg_Loading.appendChild(Utils.CreateSpinner());
            document.body.appendChild(this._bg_Loading);
        }
        this._bg_Loading.classList.add("show");
        this._bg_Loading.style.display = "block";
        var uiFileLocation = "/";
        var formData = new FormData();
        formData.append('file', new File([this.SerializeWorkspace()], "ui.json"));
        $.ajax({
            url: '/api/dir?path=' + uiFileLocation,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            statusCode: {
                200: function (data) {
                    _this._bg_Loading.classList.remove("show");
                    _this._bg_Loading.style.display = "none";
                    console.log("Saved");
                }
            }
        });
    };
    WorkSpace.prototype.SerializeWorkspace = function () {
        var elements = new Array();
        var inputs = $(".input", this.form);
        inputs.each(function (index, val) {
            var element = val;
            elements.push(Utils.GetConfig(element));
        });
        var outputs = $(".output", this.form);
        outputs.each(function (index, val) {
            var element = val;
            elements.push(Utils.GetConfig(element));
        });
        var ret = {
            bg: Utils.GetBG(this.form),
            elements: elements
        };
        return JSON.stringify(ret);
    };
    return WorkSpace;
}());
var Input = (function () {
    function Input(element) {
        this.element = element;
        this.jElement = $(element);
        this.name = this.jElement.attr("name");
    }
    Input.prototype.saveValue = function () {
        if (!this.workSpace)
            return;
        this.workSpace.beginTransaction();
        var val = this.jElement.attr("value");
        if (val) {
            this.workSpace.values[this.name] = val;
        }
        this.workSpace.endTransaction();
    };
    Input.prototype.loadValue = function (key, value) {
        if (key == this.name) {
            this.jElement.attr("value", value);
        }
    };
    Input.prototype.initLayout = function () {
        console.log("Input.Init layout");
    };
    return Input;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Button = (function (_super) {
    __extends(Button, _super);
    function Button(element) {
        var _this = _super.call(this, element) || this;
        _this.audio = null;
        var sound = _this.jElement.data("sound");
        if (sound) {
            _this.audio = new Audio(sound);
            _this.audio.load();
        }
        _this.sound_duration = _this.jElement.data("sound-duration");
        if ("ontouchstart" in document.documentElement) {
            _this.element.addEventListener('touchstart', function (event) { return _this.onTouchStart(event); }, false);
            _this.element.addEventListener('touchend', function (event) { return _this.onTouchEnd(event); }, false);
        }
        else {
            _this.element.addEventListener('mousedown', function (event) { return _this.onMouseDown(event); }, false);
            _this.element.addEventListener('mouseup', function (event) { return _this.onMouseUp(event); }, false);
        }
        return _this;
    }
    Button.prototype.onTouchStart = function (event) {
        this.pressed = true;
        this.saveValue();
        this.Activate();
        this.playSound();
        event.preventDefault();
    };
    Button.prototype.onTouchEnd = function (event) {
        this.pressed = false;
        this.saveValue();
        event.preventDefault();
    };
    Button.prototype.onMouseDown = function (event) {
        this.pressed = true;
        this.saveValue();
        this.Activate();
        this.playSound();
        event.preventDefault();
    };
    Button.prototype.onMouseUp = function (event) {
        this.pressed = false;
        this.saveValue();
        event.preventDefault();
    };
    Button.prototype.Activate = function () {
        var _this = this;
        this.jElement.addClass("active");
        setTimeout(function () { _this.jElement.removeClass("active"); }, 200);
    };
    Button.prototype.playSound = function () {
        var _this = this;
        if (this.audio == null)
            return;
        if (!this.audio.paused)
            return;
        this.audio.currentTime = 0;
        var playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(function (_) {
                setTimeout(function () { _this.audio.pause(); }, _this.sound_duration);
            });
        }
    };
    Button.prototype.saveValue = function () {
        if (!this.workSpace)
            return;
        this.workSpace.beginTransaction();
        var key = this.name;
        if (this.pressed) {
            this.workSpace.values[key] = "1";
        }
        else {
            this.workSpace.values[key] = "0";
        }
        this.workSpace.endTransaction();
    };
    return Button;
}(Input));
var PositionsTypes;
(function (PositionsTypes) {
    PositionsTypes["top"] = "top";
    PositionsTypes["bottom"] = "bottom";
    PositionsTypes["left"] = "left";
    PositionsTypes["right"] = "right";
    PositionsTypes["top_left"] = "top-left";
    PositionsTypes["top_right"] = "top-right";
    PositionsTypes["bottom_left"] = "bottom-left";
    PositionsTypes["bottom_right"] = "bottom-right";
})(PositionsTypes || (PositionsTypes = {}));
var ComponentFrame = (function () {
    function ComponentFrame(element) {
        var _this = this;
        this.dots = new Array();
        this.pressed = false;
        this.sizeDot = null;
        this.startSize = new Point();
        this.startPos = new Point();
        this.cursorStart = new Point();
        this.cursorCurrent = new Point();
        this.snapSize_vw = new Point(0.5, 0.5);
        this.snapSize_px = new Point();
        this.frameMinimumSize_px = new Point();
        this.frameMinimumSize_vw = new Point(2, 2);
        this.element = element;
        var div = document.createElement("DIV");
        div.classList.add("component-frame");
        var _loop_1 = function (i) {
            var sizeDot = document.createElement("DIV");
            sizeDot.classList.add("size-dot");
            sizeDot.classList.add(ComponentFrame.positionsTypes[i]);
            if ("ontouchstart" in document.documentElement) {
                sizeDot.addEventListener('touchstart', function (event) { return _this.onTouchStart(event, sizeDot); }, false);
                sizeDot.addEventListener('touchmove', function (event) { return _this.onTouchMove(event, sizeDot); }, false);
                sizeDot.addEventListener('touchend', function (event) { return _this.onTouchEnd(event, sizeDot); }, false);
            }
            else {
                sizeDot.addEventListener('mousedown', function (event) { return _this.onMouseDown(event, sizeDot); }, false);
                sizeDot.addEventListener('mousemove', function (event) { return _this.onMouseMove(event, sizeDot); }, false);
                sizeDot.addEventListener('mouseup', function (event) { return _this.onMouseUp(event, sizeDot); }, false);
            }
            this_1.dots.push(sizeDot);
            div.appendChild(sizeDot);
        };
        var this_1 = this;
        for (var i = 0; i < 8; i++) {
            _loop_1(i);
        }
        this.moveDiv = document.createElement("DIV");
        this.moveDiv.classList.add("move-dot");
        if ("ontouchstart" in document.documentElement) {
            this.moveDiv.addEventListener('touchstart', function (event) { return _this.onTouchStart(event, null); }, false);
            this.moveDiv.addEventListener('touchmove', function (event) { return _this.onTouchMove(event, null); }, false);
            this.moveDiv.addEventListener('touchend', function (event) { return _this.onTouchEnd(event, null); }, false);
        }
        else {
            this.moveDiv.addEventListener('mousedown', function (event) { return _this.onMouseDown(event, null); }, false);
            this.moveDiv.addEventListener('mousemove', function (event) { return _this.onMouseMove(event, null); }, false);
            this.moveDiv.addEventListener('mouseup', function (event) { return _this.onMouseUp(event, null); }, false);
        }
        div.appendChild(this.moveDiv);
        this.frameDiv = div;
        this.ApplySizeFromElement(this.element.clientWidth, this.element.clientHeight);
        this.ApplyOffsetFromElement(this.element.offsetLeft, this.element.offsetTop);
        this.element.parentElement.appendChild(div);
    }
    ComponentFrame.prototype.UpdateLayout = function () {
        this.ApplySizeFromElement(this.element.clientWidth, this.element.clientHeight);
        this.ApplyOffsetFromElement(this.element.offsetLeft, this.element.offsetTop);
    };
    ComponentFrame.prototype.CalulateMinimumFrmaeSize = function () {
        if (this.dots.length > 0) {
            var dpi = this.Workspace.getPixelPerVW();
            this.frameMinimumSize_px.x = dpi.x * this.frameMinimumSize_vw.x;
            this.frameMinimumSize_px.y = dpi.y * this.frameMinimumSize_vw.y;
        }
    };
    ComponentFrame.prototype.CalculateSnapSize = function () {
        if (this.dots.length > 0) {
            var dpi = this.Workspace.getPixelPerVW();
            this.snapSize_px.x = dpi.x * this.snapSize_vw.x;
            this.snapSize_px.y = dpi.y * this.snapSize_vw.y;
        }
    };
    ComponentFrame.prototype.ApplyOffsetFromElement = function (x, y) {
        this.frameDiv.style.left = "".concat(x, "px");
        this.frameDiv.style.top = "".concat(y, "px");
    };
    ComponentFrame.prototype.ApplySizeFromElement = function (w, h) {
        this.frameDiv.style.width = "".concat(w, "px");
        this.frameDiv.style.height = "".concat(h, "px");
    };
    ComponentFrame.prototype.beginEdit = function () {
        this.CalulateMinimumFrmaeSize();
        this.CalculateSnapSize();
        if (this.sizeDot == null)
            this.moveDiv.classList.add("current");
        else
            this.sizeDot.classList.add("current");
        this.startPos = this.snapPoint(new Point(this.frameDiv.offsetLeft, this.frameDiv.offsetTop));
        this.startSize = this.snapPoint(new Point(this.frameDiv.offsetWidth, this.frameDiv.offsetHeight));
        this.frameDiv.style.zIndex = "100";
    };
    ComponentFrame.prototype.endEdit = function () {
        if (this.sizeDot == null)
            this.moveDiv.classList.remove("current");
        else
            this.sizeDot.classList.remove("current");
        this.sizeDot = null;
        this.frameDiv.style.zIndex = "0";
        this.ApplyDimentionsToElement();
    };
    ComponentFrame.prototype.onTouchStart = function (event, sizeDot) {
        this.pressed = true;
        this.sizeDot = sizeDot;
        this.beginEdit();
        this.cursorStart = this.snapPoint(Slider.pointFromTouch(this.frameDiv, event.targetTouches[0]));
    };
    ComponentFrame.prototype.onTouchMove = function (event, sizeDot) {
        event.preventDefault();
        if (this.pressed === true) {
            this.cursorCurrent = this.snapPoint(Slider.pointFromTouch(this.frameDiv, event.targetTouches[0]));
            this.ResizeFrame();
        }
    };
    ComponentFrame.prototype.onTouchEnd = function (event, sizeDot) {
        this.pressed = false;
        this.endEdit();
    };
    ComponentFrame.prototype.onMouseDown = function (event, sizeDot) {
        this.Workspace.SetCurrentFrame(this);
        this.pressed = true;
        this.sizeDot = sizeDot;
        this.beginEdit();
        this.cursorStart = this.snapPoint(Slider.pointFromMouseEvent(this.frameDiv, event));
        event.preventDefault();
    };
    ComponentFrame.prototype.onMouseMove = function (event, sizeDot) {
        if (this.pressed === true) {
            this.cursorCurrent = this.snapPoint(Slider.pointFromMouseEvent(this.frameDiv, event));
            this.ResizeFrame();
            event.preventDefault();
        }
    };
    ComponentFrame.prototype.onMouseUp = function (event, sizeDot) {
        event.preventDefault();
        this.pressed = false;
        this.endEdit();
    };
    ComponentFrame.prototype.Hide = function () {
        if (this.frameDiv.classList.contains("current")) {
            this.frameDiv.classList.remove("current");
        }
    };
    ComponentFrame.prototype.Show = function () {
        if (!this.frameDiv.classList.contains("current")) {
            this.frameDiv.classList.add("current");
        }
    };
    ComponentFrame.prototype.snapPoint = function (pt) {
        var ret = new Point();
        ret.x = Math.round(pt.x / this.snapSize_px.x) * this.snapSize_px.x;
        ret.y = Math.round(pt.y / this.snapSize_px.y) * this.snapSize_px.y;
        return ret;
    };
    ComponentFrame.prototype.ResizeFrame = function () {
        if (this.pressed != true)
            return;
        var delta = new Point();
        delta.x = this.cursorCurrent.x - this.cursorStart.x;
        delta.y = this.cursorCurrent.y - this.cursorStart.y;
        var newPos = new Point();
        newPos.x = this.startPos.x;
        newPos.y = this.startPos.y;
        var newSize = new Point();
        newSize.x = this.startSize.x;
        newSize.y = this.startSize.y;
        if (this.sizeDot == null) {
            this.startPos.x += delta.x;
            newPos.x += delta.x;
            this.startPos.y += delta.y;
            newPos.y += delta.y;
        }
        else {
            if (this.sizeDot.classList.contains(PositionsTypes.top)
                || this.sizeDot.classList.contains(PositionsTypes.top_left)
                || this.sizeDot.classList.contains(PositionsTypes.top_right)) {
                this.startPos.y += delta.y;
                this.startSize.y -= delta.y;
                newPos.y += delta.y;
                newSize.y += -delta.y;
                if (newSize.y < this.frameMinimumSize_px.y) {
                    var i = this.frameMinimumSize_px.y - newSize.y;
                    this.startPos.y -= i;
                    this.startSize.y += i;
                    newPos.y -= i;
                    newSize.y += i;
                }
            }
            if (this.sizeDot.classList.contains(PositionsTypes.bottom)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_left)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_right)) {
                newSize.y += delta.y;
            }
            if (this.sizeDot.classList.contains(PositionsTypes.left)
                || this.sizeDot.classList.contains(PositionsTypes.top_left)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_left)) {
                this.startPos.x += delta.x;
                this.startSize.x -= delta.x;
                newPos.x += delta.x;
                newSize.x += -delta.x;
                if (newSize.x < this.frameMinimumSize_px.x) {
                    var i = this.frameMinimumSize_px.x - newSize.x;
                    this.startPos.x -= i;
                    this.startSize.x += i;
                    newPos.x -= i;
                    newSize.x += i;
                }
            }
            if (this.sizeDot.classList.contains(PositionsTypes.right)
                || this.sizeDot.classList.contains(PositionsTypes.top_right)
                || this.sizeDot.classList.contains(PositionsTypes.bottom_right)) {
                newSize.x += delta.x;
            }
            if (newSize.x < this.frameMinimumSize_px.x)
                newSize.x = this.frameMinimumSize_px.x;
            if (newSize.y < this.frameMinimumSize_px.y)
                newSize.y = this.frameMinimumSize_px.y;
        }
        this.ApplySizeFromElement(newSize.x, newSize.y);
        this.ApplyOffsetFromElement(newPos.x, newPos.y);
    };
    ComponentFrame.prototype.ApplyDimentionsToElement = function () {
        var dpi = this.Workspace.getPixelPerVW();
        var pos = (new Point(this.frameDiv.offsetLeft / dpi.x, this.frameDiv.offsetTop / dpi.y)).Round(this.snapSize_vw);
        var sz = new Point(this.frameDiv.offsetWidth / dpi.x, this.frameDiv.offsetHeight / dpi.y).Round(this.snapSize_vw);
        this.element.style.left = "".concat(pos.x, "vw");
        this.element.style.top = "".concat(pos.y, "vw");
        this.element.style.width = "".concat(sz.x, "vw");
        this.element.style.height = "".concat(sz.y, "vw");
        var cfg = this.element.Config;
        cfg.x = pos.x;
        cfg.y = pos.y;
        cfg.w = sz.x;
        cfg.h = sz.y;
    };
    ComponentFrame.positionsTypes = [
        PositionsTypes.top,
        PositionsTypes.bottom,
        PositionsTypes.left,
        PositionsTypes.right,
        PositionsTypes.top_left,
        PositionsTypes.top_right,
        PositionsTypes.bottom_left,
        PositionsTypes.bottom_right
    ];
    return ComponentFrame;
}());
var Output = (function () {
    function Output(element) {
        this.audio = null;
        this.element = element;
        this.jElement = $(element);
        this.name = this.jElement.data("input");
        console.log(this.name);
        var sound = this.jElement.data("sound");
        if (sound) {
            this.audio = new Audio(sound);
            this.audio.load();
            this.sound_duration = this.jElement.data("sound-duration");
        }
    }
    Output.prototype.loadValue = function () {
        if (this.name === undefined)
            return;
        if (!(this.workSpace.values[this.name] == undefined)) {
            var newValue = this.workSpace.values[this.name];
            if (this.element.tagName.toUpperCase() == "INPUT") {
                this.jElement.val(newValue);
            }
            if (this.element.tagName.toUpperCase() == "IMG") {
                if (newValue == "0") {
                    this.jElement.addClass("hidden");
                }
                else {
                    this.jElement.removeClass("hidden");
                }
            }
            if (this.element.classList.contains("progress")) {
                $(".progress-bar", this.jElement).width((newValue) + "%");
            }
            else {
                this.jElement.text(newValue);
            }
            if (this.value == "0" && !(newValue == "0")) {
                this.playSound();
            }
            ;
            this.value = newValue;
        }
    };
    Output.prototype.initLayout = function () {
    };
    Output.prototype.playSound = function () {
        var _this = this;
        if (this.audio == null)
            return;
        if (!this.audio.paused)
            return;
        this.audio.currentTime = 0;
        var playPromise = this.audio.play();
        if (playPromise !== undefined && this.sound_duration !== undefined) {
            playPromise.then(function (_) {
                setTimeout(function () { _this.audio.pause(); }, _this.sound_duration);
            });
        }
    };
    return Output;
}());
var PropertyEditor = (function () {
    function PropertyEditor() {
        this.frame = null;
        this.fields = new Array();
        this.PropertyWindow = null;
        this.PropertyWinodwBody = null;
    }
    PropertyEditor.prototype.Show = function (frame) {
        var _this = this;
        if (this.frame != null) {
            this.Hide();
        }
        if (this.PropertyWinodwBody == null) {
            this.PropertyWinodwBody = document.createElement("div");
            this.PropertyWindow = Utils.CreateModalDialog("Properties", this.PropertyWinodwBody, function () { _this.Save_Click(); });
        }
        this.frame = frame;
        this.element = frame.element;
        this.config = (this.element).Config;
        console.log(this.config);
        this.PropertyWinodwBody.innerHTML = "";
        this.fields = new Array();
        var _loop_2 = function () {
            var inputGroup = document.createElement("DIV");
            inputGroup.classList.add("input-group");
            inputGroup.classList.add("my-2");
            var preffix = document.createElement("DIV");
            preffix.classList.add("input-group-prepend");
            inputGroup.appendChild(preffix);
            var span = document.createElement("SPAN");
            span.classList.add("input-group-text");
            span.style.width = "120px";
            span.innerText = key;
            preffix.appendChild(span);
            var input;
            if (PropertyEditor.readonlyProperties.indexOf(key) == -1) {
                input = document.createElement("INPUT");
                input.classList.add("form-control");
                input.setAttribute("Name", key);
                if (key == "color")
                    input.setAttribute("type", "color");
                else
                    input.setAttribute("type", "text");
                input.setAttribute("value", this_2.config[key]);
                inputGroup.appendChild(input);
                if (PropertyEditor.PropertySelectors[key]) {
                    var btnDiv = document.createElement("DIV");
                    btnDiv.classList.add("input-group-append");
                    var btn = document.createElement("BUTTON");
                    btn.classList.add("btn");
                    btn.classList.add("btn-outline-secondary");
                    btn.innerText = "Select";
                    btn.onclick = function () {
                        PropertyEditor.PropertySelectors[key].Invoke(input);
                    };
                    btnDiv.appendChild(btn);
                    inputGroup.appendChild(btnDiv);
                }
            }
            else {
                input = document.createElement("SPAN");
                input.classList.add("form-control");
                input.innerText = this_2.config[key];
                inputGroup.appendChild(input);
                input = null;
            }
            this_2.PropertyWinodwBody.appendChild(inputGroup);
            this_2.fields.push({
                name: key,
                context: this_2.config,
                input: input
            });
        };
        var this_2 = this;
        for (var key in this.config) {
            _loop_2();
        }
        $(this.PropertyWindow).modal({ backdrop: 'static' });
    };
    PropertyEditor.prototype.Save_Click = function () {
        console.log(this.config);
        for (var i = 0; i < this.fields.length; i++) {
            var fld = this.fields[i];
            if (fld.input != null) {
                this.config[fld.name] = $(fld.input).val();
            }
        }
        Utils.ApplyDimentionsProperties(this.element, this.config);
        Utils.ApplyTextProperty(this.element, this.config);
        if (this.config.type == "progress") {
            Utils.ApplyProgressProperties(this.element, this.config);
        }
        this.frame.UpdateLayout();
        $(this.PropertyWindow).modal('hide');
    };
    PropertyEditor.prototype.Hide = function () {
        console.log("hide");
    };
    PropertyEditor.readonlyProperties = ["type"];
    PropertyEditor.PropertySelectors = {
        src: {
            Invoke: function (element) {
                ImageSelector.Show(element);
            }
        }
    };
    return PropertyEditor;
}());
var Slider = (function (_super) {
    __extends(Slider, _super);
    function Slider(element) {
        var _this = _super.call(this, element) || this;
        _this.pressed = false;
        _this.handlePos = new Point();
        _this.value = new Point();
        _this.center = new Point();
        _this.autoCenterX = false;
        _this.autoCenterY = false;
        _this.handle = $(".handle", element)[0];
        var pot = $(".pot", element);
        if (pot.length > 0) {
            _this.pot = pot[0];
        }
        if ("ontouchstart" in document.documentElement) {
            _this.element.addEventListener('touchstart', function (event) { return _this.onTouchStart(event); }, false);
            _this.element.addEventListener('touchmove', function (event) { return _this.onTouchMove(event); }, false);
            _this.element.addEventListener('touchend', function (event) { return _this.onTouchEnd(event); }, false);
        }
        else {
            _this.element.addEventListener('mousedown', function (event) { return _this.onMouseDown(event); }, false);
            _this.element.addEventListener('mousemove', function (event) { return _this.onMouseMove(event); }, false);
            _this.element.addEventListener('mouseup', function (event) { return _this.onMouseUp(event); }, false);
        }
        _this.initLayout();
        if ($(element).data("center")) {
            _this.autoCenterX = true;
            _this.autoCenterY = true;
        }
        else if ($(element).data("center-x")) {
            _this.autoCenterX = true;
        }
        else if ($(element).data("center-y")) {
            _this.autoCenterY = true;
            _this.autoCenterY = true;
        }
        _this.refreshLayout(true);
        return _this;
    }
    Slider.prototype.onTouchStart = function (event) {
        this.pressed = true;
        this.element.style.zIndex = "100";
    };
    Slider.prototype.onTouchMove = function (event) {
        event.preventDefault();
        if (this.pressed === true) {
            this.handlePos = Slider.pointFromTouch(this.element, event.targetTouches[0]);
            this.refreshLayout(false);
            this.saveValue();
        }
    };
    Slider.prototype.onTouchEnd = function (event) {
        this.pressed = false;
        if (this.autoCenterX)
            this.handlePos.x = this.center.x;
        if (this.autoCenterY)
            this.handlePos.y = this.center.y;
        this.refreshLayout(true);
        this.saveValue();
        this.element.style.zIndex = "0";
    };
    Slider.prototype.onMouseDown = function (event) {
        this.pressed = true;
        this.element.style.zIndex = "100";
    };
    Slider.prototype.onMouseMove = function (event) {
        if (this.pressed === true) {
            this.handlePos = Slider.pointFromMouseEvent(this.element, event);
            this.refreshLayout(false);
            this.saveValue();
        }
    };
    Slider.prototype.onMouseUp = function (event) {
        this.pressed = false;
        if (this.autoCenterX)
            this.handlePos.x = this.center.x;
        if (this.autoCenterY)
            this.handlePos.y = this.center.y;
        this.refreshLayout(true);
        this.saveValue();
        var key_x = this.name + "_x";
        var key_y = this.name + "_y";
        this.workSpace.refreshInput(key_x, Slider.numToString(this.value.x));
        this.workSpace.refreshInput(key_y, Slider.numToString(this.value.y));
        this.element.style.zIndex = "0";
    };
    Slider.prototype.refreshLayout = function (clip) {
        if (clip) {
            if (this.handlePos.x < 0)
                this.handlePos.x = 0;
            if (this.handlePos.y < 0)
                this.handlePos.y = 0;
            if (this.handlePos.x > this.element.clientWidth)
                this.handlePos.x = this.element.clientWidth;
            if (this.handlePos.y > this.element.clientHeight)
                this.handlePos.y = this.element.clientHeight;
        }
        this.handle.style.left = '' + (this.handlePos.x - (this.handle.clientWidth / 2)) + 'px';
        this.handle.style.top = '' + (this.handlePos.y - (this.handle.clientHeight / 2)) + 'px';
        var clipped = new Point();
        clipped.x = this.handlePos.x;
        clipped.y = this.handlePos.y;
        if (clipped.x < 0)
            clipped.x = 0;
        if (clipped.y < 0)
            clipped.y = 0;
        if (clipped.x > this.element.clientWidth)
            clipped.x = this.element.clientWidth;
        if (clipped.y > this.element.clientHeight)
            clipped.y = this.element.clientHeight;
        var normalized = new Point();
        normalized.x = (this.center.x - clipped.x) * 100.0 / (this.element.clientWidth / 2.0);
        normalized.y = (this.center.y - clipped.y) * 100.0 / (this.element.clientHeight / 2.0);
        this.value = normalized;
        if (this.pot) {
            this.pot.style.left = '' + (clipped.x - (this.pot.clientWidth / 2.0)) + 'px';
            this.pot.style.top = '' + (clipped.y - (this.pot.clientHeight / 2.0)) + 'px';
        }
    };
    Slider.prototype.saveValue = function () {
        if (!this.workSpace)
            return;
        this.workSpace.beginTransaction();
        var key_x = this.name + "_x";
        this.workSpace.values[key_x] = Slider.numToString(this.value.x);
        var key_y = this.name + "_y";
        this.workSpace.values[key_y] = Slider.numToString(this.value.y);
        this.workSpace.endTransaction();
    };
    Slider.prototype.loadValue = function (key, value) {
        if (this.pressed == true)
            return;
        var key_x = this.name + "_x";
        var key_y = this.name + "_y";
        var refresh = false;
        if (key == key_x) {
            this.value.x = value;
            refresh = true;
        }
        if (key == key_y) {
            this.value.y = value;
            refresh = true;
        }
        if (refresh == true) {
            this.initLayout();
        }
    };
    Slider.prototype.initLayout = function () {
        this.center.x = this.element.clientWidth / 2;
        this.center.y = this.element.clientHeight / 2;
        var x = this.element.clientWidth / 2.0;
        var y = this.element.clientHeight / 2.0;
        this.handlePos.x = this.center.x - this.value.x * x / 100.0;
        this.handlePos.y = this.center.y - this.value.y * y / 100.0;
        this.handle.style.left = '' + (this.handlePos.x - (this.handle.clientWidth / 2)) + 'px';
        this.handle.style.top = '' + (this.handlePos.y - (this.handle.clientHeight / 2)) + 'px';
        if (this.pot) {
            this.pot.style.left = '' + (this.handlePos.x - (this.pot.clientWidth / 2.0)) + 'px';
            this.pot.style.top = '' + (this.handlePos.y - (this.pot.clientHeight / 2.0)) + 'px';
        }
    };
    Slider.numToString = function (n) {
        return (Math.round(n * 100.0) / 100.0).toString(10);
    };
    Slider.pointFromMouseEvent = function (container, e) {
        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;
        if (!e) {
            e = window.event;
        }
        if (e.pageX || e.pageY) {
            m_posx = e.pageX;
            m_posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        if (container.offsetParent) {
            do {
                e_posx += container.offsetLeft;
                e_posy += container.offsetTop;
            } while (container = container.offsetParent);
        }
        var pt = new Point();
        pt.x = (m_posx - e_posx);
        pt.y = (m_posy - e_posy);
        return pt;
    };
    Slider.pointFromTouch = function (container, e) {
        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;
        if (e.pageX || e.pageY) {
            m_posx = e.pageX;
            m_posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        if (container.offsetParent) {
            do {
                e_posx += container.offsetLeft;
                e_posy += container.offsetTop;
            } while (container = container.offsetParent);
        }
        var pt = new Point();
        pt.x = (m_posx - e_posx);
        pt.y = (m_posy - e_posy);
        return pt;
    };
    return Slider;
}(Input));
var Toggle = (function (_super) {
    __extends(Toggle, _super);
    function Toggle(element) {
        var _this = _super.call(this, element) || this;
        _this.SetupEvents();
        return _this;
    }
    Toggle.prototype.SetupEvents = function () {
        var _this = this;
        $(".btn", this.element).each(function (index, el) {
            if ("ontouchstart" in document.documentElement) {
                el.addEventListener('touchstart', function (event) { return _this.onTouchStart(el, event); }, false);
                el.addEventListener('touchend', function (event) { return _this.onTouchEnd(el, event); }, false);
            }
            else {
                el.addEventListener('mousedown', function (event) { return _this.onMouseDown(el, event); }, false);
                el.addEventListener('mouseup', function (event) { return _this.onMouseUp(el, event); }, false);
            }
        });
    };
    Toggle.prototype.onTouchStart = function (el, event) {
        console.log(el);
        this.pressed = this.GetElementValue(el);
        this.saveValue();
        this.workSpace.refreshInput(this.name, this.pressed);
        event.preventDefault();
    };
    Toggle.prototype.onTouchEnd = function (el, event) {
        event.preventDefault();
    };
    Toggle.prototype.onMouseDown = function (el, event) {
        console.log(el);
        this.pressed = this.GetElementValue(el);
        this.saveValue();
        this.workSpace.refreshInput(this.name, this.pressed);
        event.preventDefault();
    };
    Toggle.prototype.onMouseUp = function (el, event) {
        event.preventDefault();
    };
    Toggle.prototype.saveValue = function () {
        if (!this.workSpace)
            return;
        this.workSpace.beginTransaction();
        var key = this.name;
        this.workSpace.values[key] = this.pressed;
        this.workSpace.endTransaction();
    };
    Toggle.prototype.loadValue = function (key, value) {
        var _this = this;
        var refresh = false;
        if (key == this.name) {
            $(".btn", this.element).each(function (index, el) {
                if (_this.GetElementValue(el) == value) {
                    el.classList.add("active");
                }
                else {
                    el.classList.remove("active");
                }
            });
        }
    };
    Toggle.prototype.GetElementValue = function (el) {
        var input = $("input", el)[0];
        return input.getAttribute("value");
    };
    return Toggle;
}(Input));
var Utils = (function () {
    function Utils() {
    }
    Utils.CreateSpinner = function () {
        var ret = document.createElement("DIV");
        ret.classList.add("spinner-border");
        ret.classList.add("text-primary");
        ret.innerHTML = '<span class="sr-only">Loading...</span>';
        return ret;
    };
    Utils.CreateGrid = function (sz) {
        var div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = "0";
        div.style.top = "0";
        div.style.width = "".concat(sz.x, "vw");
        div.style.height = "".concat(sz.y, "vw");
        div.style.background = "conic-gradient(from 90deg at 0.05vw 0.05vw, rgba(0, 0, 0, 0) 90deg, rgba(1,1,1,0.1) 0deg) 0px 0px / 1vw 1vw";
        return div;
    };
    Utils.ApplyDimentionsProperties = function (div, source) {
        div.style.position = "absolute";
        if (source.x)
            div.style.left = "".concat(source.x, "vw");
        if (source.y)
            div.style.top = "".concat(source.y, "vw");
        if (source.w)
            div.style.width = "".concat(source.w, "vw");
        if (source.h)
            div.style.height = "".concat(source.h, "vw");
    };
    Utils.ApplyProgressProperties = function (div, source) {
        var itms = div.getElementsByClassName("progress-bar");
        if (itms.length > 0) {
            var el = (itms[0]);
            if (source.color)
                el.style.backgroundColor = source.color;
            else
                el.style.backgroundColor = "";
        }
    };
    Utils.ApplyTextProperty = function (div, source) {
        if (source.type == "image") {
            div.setAttribute("src", source.src);
            div.setAttribute("alt", source.text);
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
            Utils.InitToggleElement(div, source);
        }
        else {
            div.innerText = source.text;
        }
    };
    Utils.GetBG = function (el) {
        var ret = el.style.backgroundImage;
        while (ret.indexOf('"') >= 0)
            ret = ret.replace('"', "'");
        return ret;
    };
    Utils.GetConfig = function (element) {
        var cfg = element.Config;
        if (element.style.left)
            cfg.x = Utils.IntFromVw(element.style.left);
        if (element.style.top)
            cfg.y = Utils.IntFromVw(element.style.top);
        if (element.style.width)
            cfg.w = Utils.IntFromVw(element.style.width);
        if (element.style.height)
            cfg.h = Utils.IntFromVw(element.style.height);
        return cfg;
    };
    Utils.IntFromVw = function (vw) {
        return +(vw.substring(0, vw.length - 2));
    };
    Utils.CreateModalDialog = function (title, content, SaveClick) {
        var div = document.createElement("DIV");
        div.classList.add("modal");
        div.classList.add("fade");
        div.setAttribute("role", "dialog");
        var dialog = document.createElement("DIV");
        dialog.classList.add("modal-dialog");
        div.appendChild(dialog);
        var dialog_content = document.createElement("DIV");
        dialog_content.classList.add("modal-content");
        dialog.appendChild(dialog_content);
        var dialog_Header = document.createElement("DIV");
        dialog_Header.classList.add("modal-header");
        dialog_Header.innerHTML = ("<h5>".concat(title, "</h5>"));
        dialog_content.appendChild(dialog_Header);
        var dialog_Body = document.createElement("DIV");
        dialog_Body.classList.add("modal-body");
        dialog_Body.appendChild(content);
        dialog_content.appendChild(dialog_Body);
        var dialog_Footer = document.createElement("DIV");
        dialog_Footer.classList.add("modal-footer");
        var btnSave = Utils.CreateButton("Save");
        btnSave.classList.add("btn-primary");
        btnSave.addEventListener("click", SaveClick);
        dialog_Footer.appendChild(btnSave);
        var btnCancel = Utils.CreateButton("Cancel");
        btnCancel.classList.add("btn-secondary");
        btnCancel.setAttribute("data-dismiss", "modal");
        dialog_Footer.appendChild(btnCancel);
        dialog_content.appendChild(dialog_Footer);
        document.body.appendChild(div);
        return div;
    };
    Utils.CreateButton = function (text) {
        var btn = document.createElement("BUTTON");
        btn.setAttribute("type", "button");
        btn.classList.add("btn");
        btn.innerText = text;
        return btn;
    };
    Utils.InitToggleElement = function (div, el) {
        div.innerHTML = "";
        var labels = el.text.split("|");
        var values = el.values.split("|");
        for (var i = 0; i < Math.max(labels.length, values.length); i++) {
            var lbl = document.createElement("LABEL");
            lbl.classList.add("btn");
            lbl.classList.add("btn-outline-primary");
            var input = document.createElement("INPUT");
            input.setAttribute("type", "radio");
            lbl.appendChild(input);
            var span = document.createElement("SPAN");
            lbl.appendChild(span);
            var v = "0";
            if (i < values.length)
                v = values[i];
            var s = "Off";
            if (i < labels.length)
                s = labels[i];
            input.setAttribute("value", v);
            span.innerText = s;
            div.appendChild(lbl);
        }
    };
    Utils.SetTougleValue = function (div, value) {
    };
    Utils.str = function (dbl) {
        return (Math.round(dbl * 100) / 100).toFixed(2);
    };
    Utils.formatBytes = function (v) {
        if (v < 1024)
            return v + " b";
        else if (v < (1024 * 1024))
            return Utils.str(v / 1024.0) + " Kb";
        else if (v < (1024 * 1024 * 1024))
            return Utils.str(v / 1024.0 / 1024.0) + " Mb";
        else
            return Utils.str(v / 1024.0 / 1024.0 / 1024.0) + " Gb";
    };
    ;
    return Utils;
}());
var PropertySelector = (function () {
    function PropertySelector() {
    }
    return PropertySelector;
}());
var ImageSelector = (function (_super) {
    __extends(ImageSelector, _super);
    function ImageSelector(elenemt) {
        var _this = _super.call(this) || this;
        _this.selectedFile = "";
        _this.elenemt = elenemt;
        _this.jElenemt = $(_this.elenemt);
        _this.selectedFile = _this.jElenemt.val().toString();
        _this.InitializeDialogWindow();
        return _this;
    }
    ImageSelector.prototype.InitializeDialogWindow = function () {
        var _this = this;
        this.dialogContent = document.createElement("DIV");
        this.dialogContent.innerHTML = "\n        <p>Selected file: <span class=\"selected-file\"></span></p>\n        <table class=\"files table table-striped table-borderless\" style=\"table-layout: fixed;\">\n            <colgroup>\n                <col id=\"files-col1\">\n                <col id=\"files-col2\">\n                <col id=\"files-col3\">\n            </colgroup>\n            <thead>\n                <tr>\n                    <th></th>\n                    <th>Name</th>\n                    <th>Size</th>\n                </tr>\n            </thead>\n            <tbody class=\"files-list\"></tbody>\n        </table>";
        this.dialog = Utils.CreateModalDialog("Select file", this.dialogContent, function () { _this.Save(); });
        this.FileList = $(".files-list");
        this.Title = $(".modal-header h5");
        this.spanFile = $("span.selected-file");
        this.spanFile.text(this.selectedFile);
    };
    ImageSelector.Show = function (element) {
        var elWithSelector = element;
        var PropertySelector = elWithSelector.selector;
        if (PropertySelector === undefined) {
            PropertySelector = new ImageSelector(element);
            elWithSelector.selector = PropertySelector;
        }
        if (PropertySelector) {
            PropertySelector.ShowSelector();
        }
    };
    ImageSelector.prototype.ShowSelector = function () {
        $(this.dialog).modal({ backdrop: 'static' });
        this.LoadDir("/html/img/");
    };
    ImageSelector.prototype.Save = function () {
        this.selectedFile = this.selectedFile.replace("/html/", "/");
        this.jElenemt.val(this.selectedFile);
        $(this.dialog).modal('hide');
    };
    ImageSelector.prototype.fileComparator = function (a, b) {
        return (a.dir < b.dir) ? 1 : ((a.dir > b.dir) ? -1 : (a.Name < b.Name) ? -1 : ((a.Name > b.Name) ? 1 : 0));
    };
    ImageSelector.prototype.RendeFileList = function (files) {
        var _this = this;
        var s = "";
        $.each(files, function (index, value) {
            var c = "";
            if (value.dir == false) {
                c = "file-row";
            }
            else {
                c = "dir-row";
            }
            s += "<tr class='" + c + "' data-name='" + value.Name + "'><td class='";
            if (value.dir == false) {
                s += "file";
                s += "'>&#128463;</td><td class='fname'>";
                s += value.Name;
                s += "</td><td class='text-center'>";
                s += Utils.formatBytes(value.Size);
                s += "</td>";
            }
            else {
                s += "dir";
                s += "'>&#128193;</td><td class='fdir'>";
                s += value.Name;
                s += "</td><td></td>";
            }
            s += "</tr>";
        });
        this.FileList.html(s);
        $("tr.file-row").on("click", function (e) { _this.FileNameClicked(e, e.delegateTarget); });
    };
    ImageSelector.prototype.LoadDir = function (path) {
        var _this = this;
        $.ajax({
            url: '/api/dir?path=' + path,
            success: function (result) {
                _this.curPath = path;
                var arr = result;
                arr.sort(_this.fileComparator);
                _this.RendeFileList(arr);
                _this.Title.text(_this.curPath);
            },
            error: function (result) {
                console.log(result);
            }
        });
    };
    ImageSelector.prototype.FileNameClicked = function (e, el) {
        $("tr.active").removeClass("active");
        el.classList.add("active");
        this.selectedFile = this.curPath + el.getAttribute("data-name");
        this.spanFile.text(this.selectedFile);
    };
    return ImageSelector;
}(PropertySelector));
