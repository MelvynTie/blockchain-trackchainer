$ ( document ).ready(function() {
    /* Listen on the key press event */
    $( "#inputBlockNo" ).keyup(function( event ) {
        var key = event.keyCode;
        if (key >= 48 && key <= 57) {
            event.preventDefault();
        }
        $( "#blockTable tbody" ).children().remove();
        var value = $("#inputBlockNo").val();
        $.ajax({
            url: 'v1/api/block',
            method: 'POST',
            data: { noOfLastBlocks:value },
            mimeType: 'json',
            success: function(data) {
                    $.each(data, function(i, data) {
                        var body = "<tr>";
                    body    += "<td>" + data.id + "</td>";
                    body    += "<td>" + data.fingerprint + "</td>";
                    //body    += "<td>" + data.transactions[0].timestamp + "</td>";
                    body    += "</tr>";
                    $( "#blockTable tbody" ).append(body);
                });
                /*DataTables instantiation.*/
                var blockTable = $( "#blockTable" ).DataTable();
            }
        });
    });    
});