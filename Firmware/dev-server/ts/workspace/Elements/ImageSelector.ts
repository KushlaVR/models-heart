class PropertySelector {

}

class ImageSelector extends PropertySelector {

    private spanFile: JQuery;
    private Title: JQuery;
    private FileList: JQuery;
    private jElenemt: JQuery;
    private elenemt: HTMLElement;
    private dialog: HTMLElement;
    private dialogContent: HTMLElement;
    private selectedFile: string = "";

    constructor(elenemt: HTMLElement) {
        super();
        this.elenemt = elenemt;
        this.jElenemt = $(this.elenemt);
        this.selectedFile = this.jElenemt.val().toString();
        this.InitializeDialogWindow();
    }

    public InitializeDialogWindow(): void {
        this.dialogContent = document.createElement("DIV");
        this.dialogContent.innerHTML = `
        <p>Selected file: <span class="selected-file"></span></p>
        <table class="files table table-striped table-borderless" style="table-layout: fixed;">
            <colgroup>
                <col id="files-col1">
                <col id="files-col2">
                <col id="files-col3">
            </colgroup>
            <thead>
                <tr>
                    <th></th>
                    <th>Назва</th>
                    <th>Розмір</th>
                </tr>
            </thead>
            <tbody class="files-list"></tbody>
        </table>`;
        this.dialog = Utils.CreateModalDialog("Select file", this.dialogContent, () => { this.Save(); });
        this.FileList = $(".files-list");
        this.Title = $(".modal-header h5");
        this.spanFile = $("span.selected-file");
        this.spanFile.text(this.selectedFile);
    }

    public static Show(element: HTMLElement): void {
        let elWithSelector = <ElementWithPropertySelector><any>element;
        let PropertySelector = elWithSelector.selector;
        if (PropertySelector === undefined) {
            PropertySelector = new ImageSelector(element);
            elWithSelector.selector = PropertySelector;
        }
        if (PropertySelector) {
            (<ImageSelector>PropertySelector).ShowSelector();
        }
    }


    public ShowSelector() {
        (<any>$(this.dialog)).modal({ backdrop: 'static' });
        this.LoadDir("/html/img/");
    }

    public Save(): void {
        this.selectedFile = this.selectedFile.replace("/html/", "/")
        this.jElenemt.val(this.selectedFile);
        (<any>$(this.dialog)).modal('hide');
    }

    curPath: string;

    fileComparator(a: FileRecord, b: FileRecord) {
        return (a.dir < b.dir) ? 1 : ((a.dir > b.dir) ? -1 : (a.Name < b.Name) ? -1 : ((a.Name > b.Name) ? 1 : 0));
    }

    private RendeFileList(files: Array<FileRecord>) {
        let s = "";
        $.each(files, function (index, value) {
            s += "<tr><td><div class='";
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
        $("td.fname").on("click", (e) => { this.FileNameClicked(e, e.target); })

    }

    private LoadDir(path: string): void {
        $.ajax({
            url: '/api/dir?path=' + path,
            success: (result) => {
                this.curPath = path;
                var arr = result;
                arr.sort(this.fileComparator);
                this.RendeFileList(arr);
                this.Title.text(this.curPath);
            },
            error: function (result) {
                console.log(result);
            }
        })
    }

    private FileNameClicked(e: JQuery.Event, el: HTMLElement) {
        this.selectedFile = this.curPath + el.innerText;
        this.spanFile.text(this.selectedFile);
    }
}