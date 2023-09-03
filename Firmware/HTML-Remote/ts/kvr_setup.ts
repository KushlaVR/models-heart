/**
 * Author: kushlavr@gmail.com
 * */
class KVR {
    static load(endpoint: string) {
        var form = $("#form");
        $.get(endpoint)
            .done(function (data) {
                $.each(data, (name: string, value: string) => {
                    console.log("Name: " + name + ", Value: " + value);
                    $("[name=" + name + "]", form).val(value);
                });
            })
            .fail(function () {
                console.log("error");
            });
    }
}
