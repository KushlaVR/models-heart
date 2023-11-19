
class Button extends Input {

    pressed: boolean;
    sound_duration: number;
    audio: HTMLAudioElement = null;

    constructor(element: any) {
        super(element);

        let sound: string = this.jElement.data("sound");
        if (sound) {
            this.audio = new Audio(sound);
            this.audio.load();
        }
        this.sound_duration = this.jElement.data("sound-duration");

        if ("ontouchstart" in document.documentElement) {
            this.element.addEventListener('touchstart', (event: MouseEvent) => this.onTouchStart(event), false);
            this.element.addEventListener('touchend', (event: MouseEvent) => this.onTouchEnd(event), false);
        }
        else {
            this.element.addEventListener('mousedown', (event: MouseEvent) => this.onMouseDown(event), false);
            this.element.addEventListener('mouseup', (event: MouseEvent) => this.onMouseUp(event), false);
        }
    }

    private onTouchStart(event: MouseEvent): void {
        this.pressed = true;
        this.saveValue();
        this.Activate();
        this.playSound();
        event.preventDefault();
    }

    private onTouchEnd(event: MouseEvent): void {
        this.pressed = false;
        this.saveValue();
        event.preventDefault();
    }

    private onMouseDown(event: MouseEvent): void {
        this.pressed = true;
        this.saveValue();
        this.Activate();
        this.playSound();
        event.preventDefault();
    }

    private onMouseUp(event: MouseEvent): void {
        this.pressed = false;
        this.saveValue();
        event.preventDefault();
    }

    private Activate(): void {
        this.jElement.addClass("active");
        setTimeout(() => { this.jElement.removeClass("active") }, 200);
    }

    private playSound(): void {
        if (this.audio == null) return;
        if (!this.audio.paused) return;

        this.audio.currentTime = 0;
        let playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                setTimeout(() => { this.audio.pause(); }, this.sound_duration);
            })
        }
    }

    saveValue(): void {
        if (!this.workSpace) return;
        this.workSpace.beginTransaction();
        let key = this.name;
        if (this.pressed) {
            this.workSpace.values[key] = "1";
        }
        else {
            this.workSpace.values[key] = "0";
        }

        this.workSpace.refreshInput(key, this.workSpace.values[key]);

        this.workSpace.endTransaction();
    }
}
