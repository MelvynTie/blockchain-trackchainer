$(document).ready(function () {
    jQuery.validator.addMethod("lettersonly", function(value, element) {
        return this.optional(element) || /^[a-zA-Z][a-zA-Z ]*$/i.test(value);
      }, "Letters only please");

    $('#input-form').validate({ // initialize the plugin
        rules: {
            sn: {
                required: true
            },
            employer: {
                required: true,
                lettersonly: true
            }
        },
        messages: {
            sn: {
                required: "Please enter a serial number."
            },
            employer: {
                required: "Please enter the employer's name.",
                lettersonly: "Letters only please."
            }
        },
        // Make sure the form is submitted to the destination defined
        // in the "action" attribute of the form when valid
        submitHandler: function(form) {
            form.submit();
        }
    });
});