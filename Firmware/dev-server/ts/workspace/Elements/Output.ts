class Output {
    workSpace: WorkSpace;
    element: HTMLElement;
    jElement: JQuery;
    name: string;
    value: string;

    sound_duration: number;
    audio: HTMLAudioElement = null;

    constructor(element: any) {
        this.element = element;
        this.jElement = $(element);
        this.name = this.jElement.data("input");

        let sound: string = this.jElement.data("sound");
        if (sound) {
            this.audio = new Audio(sound);
            this.audio.load();

            this.sound_duration = this.jElement.data("sound-duration");

        }
    }

    loadValue(): void {
        if (!(this.workSpace.values[this.name] == undefined)) {
            let newValue = this.workSpace.values[this.name];
            if (this.element.tagName.toUpperCase() == "INPUT") {
                this.jElement.val(newValue);
            } if (this.element.tagName.toUpperCase() == "IMG") {
                if (newValue == "0") {
                    this.jElement.addClass("hidden")
                } else {
                    this.jElement.removeClass("hidden")
                }
            } if (this.element.classList.contains("progress-bar")) {
                this.jElement.width(<string>(newValue) + "%");
            }
            else {
                this.jElement.text(newValue);
            }

            if (this.value == "0" && !(newValue == "0")) {
                this.playSound();
            };
            this.value = newValue;
        }
    }

    initLayout(): void {

    }

    private playSound(): void {
        if (this.audio == null) return;
        if (!this.audio.paused) return;

        this.audio.currentTime = 0;
        let playPromise = this.audio.play();
        if (playPromise !== undefined && this.sound_duration !== undefined) {
            playPromise.then(_ => {
                setTimeout(() => { this.audio.pause(); }, this.sound_duration);
            })
        }
    }

}