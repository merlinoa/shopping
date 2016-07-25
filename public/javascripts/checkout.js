Stripe.setPublishableKey('pk_test_07whsraZq4boQRlIHjPVtI1W');

var $form = $('#checkout-form');

$form.submit(function(event) {
    // remove any error messages if they exist
    $('#charge-error').addClass('hidden');
    // set button to disabled once the form is submitted so
    // user cannot submit the form multiple times when validation is
    // going on
    $form.find('button').prop('disbabled', true);
    
    Stripe.card.createToken({
        number: $('#card-number').val(),
        cvc: $('#card-cvc').val(),
        exp_month: $('#card-expiry-month').val(),
        exp_year: $('#card-expiry-year').val(),
        name: $('#card-name').val()
    }, stripeResponseHandler);
    
    // do not submit to server bc it has not been validated yet
    return false;
});

function stripeResponseHandler(status, response) {
    if (response.error) {
        // show errors on the form
        $('#charge-error').text(response.error.message);
        $('#charge-error').removeClass('hidden');
        $form.find('button').prop('disabled', false); // Re-enable submission
        
    } else {
        
        // Get the token ID:
        var token = response.id;
        
        // Insert the token into the form so it gets submitted to the server
        $form.append($('<input type="hidden" name="stripeToken" />').val(token));
        
        // submit the form:
        $form.get(0).submit();
    }
}