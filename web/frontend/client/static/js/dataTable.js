$ ( document ).ready(function() {
    $.ajax({
        type: 'GET',
        url: 'v1/api/show',
        mimeType: 'json',
        beforeSend: function() {
            $("#loaderDiv").show();
        },
        success: function(data) {
            $("#loaderDiv").hide();
            var count = 0;
            $.each(data, function(i, data) {
                count++;

                var body = "<tr id=\"" + count + "\">";
                body    += "<td class=\"text-center\"><div id=\"id\">" + data.Key + "</div></td>";
                body    += "<td class=\"text-center\"><div id=\"serialNo\">" + data.Record.sn + "</div></td>";
                body    += "<td class=\"text-center\"><div id=\"employer\">" + data.Record.Employer + "</div></td>";
                body    += "<td class=\"text-center\"><span class=\"table-edit\"></span><div id=\"button\"><button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"edit\" type=\"button\">Edit</button></div></td>";
                body    += "<td class=\"text-center\"><span class=\"table-remove\"></span><div id=\"button\"><button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"delete\" type=\"button\">Remove</button></div></td>";
                body    += "<td class=\"text-center\"><span class=\"table-view\"></span><div id=\"button\"><form action=\"/history\" method=\"post\"><button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"history\" type=\"submit\" name=\"id\" value=\"" + data.Key + "\">View</button></form></div></td>";
                body    += "</tr>";
                $( "#dataTable tbody" ).append(body);
            });
            /*DataTables instantiation.*/
            var laptops = $( "#dataTable" ).DataTable({
                dom: 'Bfrtip',
                select: true,
                buttons: [
                    {
                        text: 'Add Laptop',
                        action: function ( e, dt, node, config ) {
                            var body = "<tr id=\"0\">";
                            body    += "<td class=\"text-center\"><div class=\"input-group\"><input type=\"text\" class=\"form-control\"  id=\"add-id\" ></div></td>";
                            body    += "<td class=\"text-center\"><div class=\"input-group\"><input type=\"text\" class=\"form-control\"  id=\"add-serialNo\" ></div></td>";
                            body    += "<td class=\"text-center\"><div class=\"input-group\"><input type=\"text\" class=\"form-control\"  id=\"add-owner\" ></div></td>";
                            body    += "<td class=\"text-center\"><span class=\"table-edit\"></span><div id=\"button\"><button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"add-confirm\" type=\"button\">Confirm</button></div></td>";
                            body    += "<td class=\"text-center\"><span class=\"table-remove\"></span><div id=\"button\"><button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"add-cancel\" type=\"button\">Cancel</button></div></td>";
                            body    += "<td class=\"text-center\"><span class=\"table-view\"></span><div id=\"button\"></div></td>";
                            body    += "</tr>";
                            $("tbody").prepend(body);
                        }
                    }
                ]
            } );
        },
        error: function() {
            alert('Fail!');
        }
    });
    
    // Delete function
    $(document).on("click", "#dataTable #delete",  function() {
        var YesButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"Yes\" type=\"button\">Yes</button>";
        var NoButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"No\" type=\"button\">No</button>";
        $(this).replaceWith(YesButton+NoButton);
    });
    
    // Yes Button
    $(document).on("click", "#dataTable #Yes",  function() {
        $(this).parent().parent().parent().addClass('clicked');
        var selectedRows = $('#dataTable tr.clicked');
        var value = selectedRows.find("#serialNo").text();
        $.ajax({
            url: 'v1/api/remove',
            method: 'POST',
            data: { sn:value },
            dataType: 'json',
            success: function( data, status, xhr ) {
                location.reload();
            }
        });
    });

    // No Button
    $(document).on("click", "#dataTable #No",  function() {
        var RemoveButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"delete\" type=\"button\">Remove</button>";
        $(this).parent().find('#Yes').remove();
        $(this).replaceWith(RemoveButton);
    });

    var OwnerName = "";
    /*Edit function*/
    $(document).on("click", "#dataTable #edit",  function() {
        $(this).parent().parent().parent().addClass('clicked');
        var selectedRows = $('#dataTable tr.clicked');
        OwnerName = selectedRows.find("#employer").text();
        $(this).parent().parent().parent().removeClass('clicked');

        var InputBar = "<div id=\"employer\" class=\"input-group\"><input type=\"text\" class=\"form-control\" aria-label=\"Amount (to the nearest dollar)\" id=\"inputEdit\" ></div>";
        $(this).parent().parent().parent().find("td #employer").replaceWith(InputBar);
        
        var ConfirmButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"Confirm\" type=\"button\">Confirm</button>";
        var CancelButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"Cancel\" type=\"button\">Cancel</button>"
        $(this).replaceWith(ConfirmButton+CancelButton);
	});
	        
	// Confirm Button
	$(document).on("click", "#dataTable #Confirm",  function() {
        $(this).parent().parent().parent().addClass('clicked');
        var selectedRows = $('#dataTable tr.clicked');
        var value = selectedRows.find("#serialNo").text();
        var newName = selectedRows.find("#inputEdit").val();
        var newID = selectedRows.find("#id").text();
		$.ajax({
			url: 'v1/api/edit',
			method: 'POST',
			data: { id:newID , sn:value , employer:newName },
			dataType: 'json',
			success: function( data, status, xhr ) {
                location.reload();
			}
		});
	});
        
    //Cancel Button
    $(document).on("click", "#dataTable #Cancel",  function() {

        var OldBox = "<div id=\"employer\">"+OwnerName+"</div>";
        $(this).parent().parent().parent().find("td .input-group ").replaceWith(OldBox);
        var EditButton = "<button class=\"btn btn-danger btn-rounded btn-sm my-0\" id=\"edit\" type=\"button\">Edit</button>";
        $(this).parent().find('#Confirm').remove();
        $(this).replaceWith(EditButton);
        OwnerName = "";
    });

    /*Add Button*/
    //Confirm
    $(document).on("click", "#dataTable #add-confirm", function() {

        $(this).parent().parent().parent().addClass('clicked');
        var selectedRows = $('#dataTable tr.clicked');
        var value = selectedRows.find("#add-id").val();
        var newName = selectedRows.find("#add-serialNo").val();
        var newID = selectedRows.find("#add-owner").val();

		$.ajax({
			url: 'v1/api/create',
			method: 'POST',
			data: { id:value , sn:newName , employer:newID },
			dataType: 'json',
			success: function( data, status, xhr ) {
                location.reload();
			}
		});
    })
    //Cancel Button
    $(document).on("click", "#dataTable #add-cancel",  function() {

        $(document).find("#0").remove();
    });
    /* History Function */
    $(document).on("click", "#dataTable #history",  function() {
        $(this).parent().parent().parent().addClass('clicked');
        var selectedRows = laptops.rows( $('#dataTable tr.clicked') ).data().to$();
        selectedRows = selectedRows.toArray();
    });
});