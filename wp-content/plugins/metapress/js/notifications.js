jQuery(document).ready(function() {
  jQuery('body').append('<div id="metapress-updating-box" class="metapress-fixed-box text-align-center"><div id="metapress-ajax-error" class="metapress-update-content border-box"><p id="metapress-ajax-error-message">This is an error message</p><label class="close-popup-box"><span class="dashicons dashicons-no-alt"></span></label></div><div id="metapress-updating-text" class="metapress-update-content border-box"><label class="close-popup-box"><span class="dashicons dashicons-no-alt"></span></label><span id="metapress-update-text" class="metapress-loading-text">Updating...</span><div id="metapress-loading-icons"><span class="loadingCircle"></span><span class="loadingCircle"></span><span class="loadingCircle"></span><span class="loadingCircle"></span></div></div></div>');

  jQuery('body').delegate('.close-popup-box', 'click', function() {
      jQuery(this).parents('.metapress-fixed-box').removeClass('show-overlay-box');
  });
});

function metapress_show_ajax_error(error_message) {
    jQuery('.close-popup-box').addClass('show');
    jQuery('#metapress-ajax-error-message').html(error_message);
    jQuery('#metapress-updating-text').hide();
    jQuery('#metapress-ajax-error').show();
    jQuery('#metapress-updating-box').addClass('show-overlay-box');
}

function metapress_show_ajax_updating(update_message) {
    jQuery('.close-popup-box').removeClass('show');
    if(update_message == null || update_message == "") {
        update_message = "Updating...";
    }
    jQuery('#metapress-ajax-error').hide();
    jQuery('#metapress-updating-text').find('#metapress-update-text').html(update_message);
    jQuery('#metapress-updating-text').show();
    jQuery('#metapress-loading-icons').show();
    jQuery('#metapress-updating-box').addClass('show-overlay-box');
}
