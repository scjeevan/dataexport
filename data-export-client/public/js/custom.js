
$(document).ready(function() {
    $("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
        e.preventDefault();
        $(this).siblings('a.active').removeClass("active");
        $(this).addClass("active");
        var index = $(this).index();
        $("div.bhoechie-tab>div.bhoechie-tab-content").removeClass("active");
        $("div.bhoechie-tab>div.bhoechie-tab-content").eq(index).addClass("active");
    });
	
});


$(document).ready(function () {
    $("#ckbCheckAll").click(function () {
        $(".ng-scope").prop('checked', $(this).prop('checked'));
    });
});

$(document).ready(function () {
    $("#CheckAll").click(function () {
        $(".checkbox_ck").prop('checked', $(this).prop('checked'));
    });
});


