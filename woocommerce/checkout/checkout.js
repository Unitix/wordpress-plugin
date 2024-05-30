jQuery(document).ready(function($) {

    $(document).ready(function() {
        var current_fs, next_fs, previous_fs; //fieldsets
        var opacity;
        var current = 1;
        var steps = $("fieldset").length;

        setProgressBar(current);

        $(".next").click(function() {
            current_fs = $(this).parent();
            next_fs = $(this).parent().next();

            // Add Class Active
            $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

            // Validate the current fieldset before proceeding
            if (validateFieldset(current_fs)) {
                // Show the next fieldset
                next_fs.show();
                // Hide the current fieldset with style
                current_fs.animate({
                    opacity: 0
                }, {
                    step: function(now) {
                        // For making fieldset appear animation
                        opacity = 1 - now;

                        current_fs.css({
                            'display': 'none',
                            'position': 'relative'
                        });
                        next_fs.css({
                            'opacity': opacity
                        });
                    },
                    duration: 500
                });
                setProgressBar(++current);
            }
        });

        $(".previous").click(function() {
            current_fs = $(this).parent();
            previous_fs = $(this).parent().prev();

            // Remove class active
            $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

            // Show the previous fieldset
            previous_fs.show();

            // Hide the current fieldset with style
            current_fs.animate({
                opacity: 0
            }, {
                step: function(now) {
                    // For making fieldset appear animation
                    opacity = 1 - now;

                    current_fs.css({
                        'display': 'none',
                        'position': 'relative'
                    });
                    previous_fs.css({
                        'opacity': opacity
                    });
                },
                duration: 500
            });
            setProgressBar(--current);
        });

        function setProgressBar(curStep) {
            var percent = parseFloat(100 / steps) * curStep;
            percent = percent.toFixed();
            $(".progress-bar")
                .css("width", percent + "%")
        }

		function validateFieldset(current_fs) {
			// Perform validation for the current fieldset (e.g., Billing details)
			var isValid = true;
			var erroClass = document.getElementsByClassName('required');
			// Example validation: Check if the input fields are empty
			current_fs.find(".validate-required input, .validate-required select").each(function() {
				if ($(this).is('input')) {
					var value = $(this).val();
					if (value === "") {
						alert("Please fill out all required fields.");
						isValid = false;
						return false; // Exit the loop early if a field is empty
					}
				} else if ($(this).is('select')) {
					var value = $(this).val();
					if (!value || value === "") {
						alert("Please select an option for all required fields.");
						isValid = false;
						return false; // Exit the loop early if a select field is not selected
					}
				}
			});

			return isValid;
		}



        $(".submit").click(function() {
            // Implement form submission logic here (e.g., AJAX submission)
            return false;
        })
    });
});
