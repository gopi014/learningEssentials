
/* JavaScript content from js/custom.js in folder common */

/* Custom JS */

// Vertical Center
applyVerticalCentering = function() {
    $(this).on('pagebeforeshow',function(e,data){
        $('[data-vertical-centred]').hide();
    });
    
    $(this).on('pageshow resize',function(e,data){    
        $('[data-vertical-centred]').each(function(index){
            var _this = $(this);
            _this.css('margin-top',
                      ($(window).height() -
                       $('header:visible').height() -
                       $('footer:visible').height() -
                       _this.outerHeight())/2);
            _this.show();
        });
    });
}();

// Progress Bar
$(function() {
	$(".meter > span").each(function() {
		$(this)
			.data("origWidth", $(this).width())
			.width(0)
			.animate({
				width: $(this).data("origWidth")
			}, 1200);
	});
});

// Tab Active
(function($) {
    $(document).on('pagecontainerbeforeshow', function() {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        $('[data-role="tabs"] ul:first', activePage).each(function(){
            var ul = this;
            var as = $('a', ul);
            $(as).click(function(){
                $(as).removeClass('ui-btn-active');
                $(this).addClass('ui-btn-active');
            });
            $(as).first().click();
        });
    });
})(jQuery);

