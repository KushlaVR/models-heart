var KVR = (function () {
    function KVR() {
    }
    KVR.load = function (endpoint) {
        var form = $("#form");
        $.get(endpoint)
            .done(function (data) {
            $.each(data, function (name, value) {
                console.log("Name: " + name + ", Value: " + value);
                $("[name=" + name + "]", form).val(value);
            });
        })
            .fail(function () {
            console.log("error");
        });
    };
    return KVR;
}());
//# sourceMappingURL=kvr_setup.js.map