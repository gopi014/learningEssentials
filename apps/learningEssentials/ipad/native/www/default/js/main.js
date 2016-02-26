
/* JavaScript content from js/main.js in folder common */
/* ***************************************************************** */
/*                                                                   */
/* IBM Confidential                                                  */
/*                                                                   */
/* OCO Source Materials                                              */
/*                                                                   */
/* Copyright IBM Corp. 2014                                          */
/*                                                                   */
/* The source code for this program is not published or otherwise    */
/* divested of its trade secrets, irrespective of what has been      */
/* deposited with the U.S. Copyright Office.                         */
/*                                                                   */
/* ***************************************************************** */
var ismanagerflag='';
var name='';
var busy='';


function wlCommonInit(){
	// Common initialization code goes here
	if(localStorage.getItem('username') != null){
		$("#j_username").val(localStorage.getItem('username'));
	}
	 if (window.device) {
		//Disable direct update feature of Worklight
		 WL.iosDeviceProfileData[WL.EPField.SUPPORT_DIRECT_UPDATE_FROM_SERVER] = false;
		 WL.iphoneProfileData[WL.EPField.SUPPORT_DIRECT_UPDATE_FROM_SERVER] = false;
		 WL.ipadProfileData[WL.EPField.SUPPORT_DIRECT_UPDATE_FROM_SERVER] = false;
		 WL.androidProfileData[WL.EPField.SUPPORT_DIRECT_UPDATE_FROM_SERVER] = false;
		 //
		 BonD.enableIMC = true;
		 if (BonD.appMode == 'dev') {
			 BonD.appServer = BonD.locServer;
		 }
		 
		 document.addEventListener("resume", $.proxy(BonD.deviceOnResume, BonD), false);
		 document.addEventListener("online", $.proxy(BonD.deviceOnline, BonD), false);
		 document.addEventListener("offline", $.proxy(BonD.deviceOffline, BonD), false);
		 document.addEventListener("backbutton", $.proxy(BonD.deviceBackbutton, BonD), false);

		 //openCache();
		 console.log('Device model: '+device.model);
		 if (isIOSEnv() || isAndroidEnv()) {
			 if (isSIMEnv()) {
				 window.j_os = window.device.platform;
				 console.log('window.os: ' +window.j_os);
			 } else {
				 window.plugins.getSerial.getSerial($.proxy(function(result) {
						window.j_serial = result.serial||result;
						window.j_os = window.device.platform;
						console.log('window.serial: ' +window.j_serial);
						console.log('window.os: ' +window.j_os);
				 }, window));
			 }
		 }
	 } else {
		 BonD.enableJSONStore = false;
		 var host = '//'+(location.host || location.hostname);
		 var isExternal = host.match(/(lmc)/i);
		 BonD.enableIMC = (isExternal ? true : false);
		 BonD.webServer.host = host;
		 //clean up the current session if any
		 WL.Client.logout(BonD.WL_AUTHEN_REALM,{onSuccess: function(){
			 console.log('Cleanup the old session on callback');
		 }});
	 }
	 
	 //open cache info
	 //Authen.getUser();
}

/**
 * SIM environment
 */
window.isSIMEnv = function () {
	if (!window.device) {
		return false;
	}
	//iOS Simulator
	var m = window.device.model;
	return ('x86_64' == m || 'x86_32' == m/* || 'sdk' == m*/);
};
/**
 * iOS environment
 */
window.isIOSEnv = function () {
	var env = WL.Client.getEnvironment();
	return (env == WL.Environment.IPHONE || env == WL.Environment.IPAD);
};
/**
 * Android environment
 */
window.isAndroidEnv = function () {
	var env = WL.Client.getEnvironment();
	return (env == WL.Environment.ANDROID);
};

//define shortcut functions
window.device = (window.device || null);
window.winAlert = window.alert || alert;
window.alert = function(message, alertCallback, title, buttonNames) {
	console.log('alert', title, message);
	if (!title || title.length == 0) {
		title = 'Alert';
	}
	if (!buttonNames || buttonNames.length == 0) {
		buttonNames = 'OK';
	}
	if (!alertCallback) {
		alertCallback = function(i) {
			console.log("OK button was clicked, index: " + i);
			WL.Client.reloadApp();
			console.log("App logged out sucessfully" + i);
		};
	}
	//open dialog
	if (window.device) {
		navigator.notification.alert(message, alertCallback, title, buttonNames);
	} else {
		openDialog('Alert', message, alertCallback, buttonNames);
	}
};
/**
 * open a dialog
 */
window.openDialog = function(title, message, okBtnCb, buttonNames) {
	var _confirmCallback = function(i) {
		console.log("button index: " + i);
		var ok = window.device? 1: 0;
		if (i == ok) {
			okBtnCb(i);
		}
	};
	if (!okBtnCb) {
		okBtnCb = function(i) {
			console.log("OK button was clicked");
		};
	}
	if (!title || title.length == 0) {
		title = 'Confirm';
	}
	if (!buttonNames || buttonNames.length == 0) {
		buttonNames = 'OK, Cancel';
	}
	//open dialog
	if (window.device) {
		navigator.notification.confirm(message, _confirmCallback, title, buttonNames);
	} else {
		openJDialog(title, message, okBtnCb);
	}
};
/**
 * open jquery dialog
 */
window.openJDialog = function(title, message, okBtnCb) {
	var isAlert = (title == 'Alert');
	try {
		  var jcontent =  $("<div/>", { id: 'popupMsg' });
		  var msg = $("<div/>", { style : 'min-width:200px;min-height:60px;'}).appendTo(jcontent);
		  $("<h3/>", { text : title }).appendTo(msg);
		  $("<p/>", { text : message.replace(/\/n/g, '<br\/>') }).appendTo(msg);
		  var btns = $("<div/>", { style: 'text-align:center;'}).appendTo(jcontent);
		  if (isAlert) {
			  $("<button>", { text : 'OK', id: 'popupOK' }).buttonMarkup({ 'inline' : true }).appendTo(btns);
		  } else {
			  $("<button>", { text : 'Cancel', id: 'popupCancel'  }).buttonMarkup({ 'inline' : true }).appendTo(btns);
			  $("<button>", { text : 'OK', id: 'popupOK'  }).buttonMarkup({ 'inline' : true }).appendTo(btns);
		  }
		setTimeout(function(){
			$.dynamic_popup({content: jcontent})
			.bind(
				{ popupafteropen: function(e){
			        console.log('Opened the popup! ' +title +','+ message);
			        window._popupCloseCb = function(cb, e){
			        	var popId = '#popup' + $.mobile.activePage.attr('id');
						  $(popId).popup('close');
						  if (cb) cb();
					  };
					  window._popupCloseNoneCb = $.proxy(window._popupCloseCb, window, null);
					  window._popupCloseOkCb = $.proxy(window._popupCloseCb, window, okBtnCb);
					  $('#popupOK').on('tap', _popupCloseOkCb);
					  $('#popupCancel').on('tap', _popupCloseNoneCb);
			    }, popupafterclose: function(e){
			    	console.log('Closed the popup! ' +title +','+ message);
			    	$(this).remove();
			    }
			});
		}, 100);
	} catch (e) {
		console.log(e);
		if (isAlert) {
			winAlert(message);
		} else {
			if (okBtnCb && confirm(message)) {
				okBtnCb();
			}
		}
	}
};
/**
 * jquery loading indicator
 */
window.jLoading = function(show) {
	if ('show' == show) {
		var option = {
				text: Messages.loading_indicator_title,
				textVisible: true,
				theme: 'a',
				textonly: false,
				html: '' };
		$.mobile.loading( show , option);
		setTimeout(function(){
			$( 'div.ui-loader' ).loader( "fakeFixLoader" );
			$( 'div.ui-loader' ).loader( "checkLoaderPosition" );
		}, 100);
	} else {
		$.mobile.loading( show );
	}
};
/**
 * jquery change page from/to 
 */
window.changePageTo = function(uri, options) {
	var settings = $.extend({'transition' : 'slide'}, options);
	$.mobile.pageContainer.pagecontainer("change", uri, settings);
};
/**
 * jquery load a page
 */
window.loadPage = function(uri, options) {
	var settings = $.extend({'role' : 'page'}, options);
	$.mobile.pageContainer.pagecontainer("load", uri, settings);
};

window.getActivePage = function() {
	var activePage = $.mobile.pageContainer.pagecontainer( "getActivePage" );
	return activePage;
};

//UI sections
$( document ).on( "pagecreate", function( event, ui ) {
	console.log('document pagecreate');
	//add a space for the status bar of ios 7 or later
	if (window.device && parseFloat(window.device.version) >= 7.0){
	      $(".ui-header").css("padding-top", "20px");
	      $(".ui-header .ui-btn").css("margin-top", "20px");
	 }
	if (WL.Client.getEnvironment() == WL.Environment.IPHONE) {
		$(".ui-slider-handle").css("margin-top", "");
		$(".ui-radio label").css("margin-top", "");
	}
});
$( document ).on( "pageshow", function( event, ui ) {
	console.log('document pageshow');
	if (isAndroidEnv()) {
		var activePage = getActivePage().attr("id");
		BonD.pageIdHistory.push(activePage);
	}
	// This is for moving down the search field, but
	// for now it's a temp solution as either mobileinit or 
	// ready event is not fired at all
 	$('.ui-field-contain input').off('blur');
 	$('.ui-field-contain input').on('blur', function(evt){
 		setTimeout(function(){
 			$.mobile.silentScroll(0);
 		}, 100);
 	});
});

$( document ).ready(function() {
	console.log( "ready!" );
	//append footer for the pages
	$("section[data-role='page']").each(function( i ) {
		if (this.id != 'login') {
			console.log('append the footer for the page: ' + this.id);
			var footer = '<footer id="footer" data-role="footer" data-theme="c" data-tap-toggle="false" data-position="fixed"><div class="sprite ibm ftr"></div></footer>';
			$(this).append(footer);
		}
	});
	
	//append the prefs for header of home page
	$("section[class='home'] header[data-role='header']").each(function( i ) {
		console.log('append the preferences for this header: ', i);
		var id = 'preferences'+i;
		var prefsAnchor = '<a href="#' + id + '" class="ui-btn-right ui-btn ui-btn-inline ui-mini ui-corner-all ui-btn-icon-right ui-icon-gear ui-btn-icon-notext">Preferences</a>';
		var prefs = '<div data-role="panel" id="' + id + '" class="preferences" data-position="right" data-display="overlay" data-theme="a" data-position-fixed="true">' +
						'<h3>Preferences</h3>' +
						'<form>' +
							'<ul data-role="listview" data-inset="true">' +
								'<li class="field-contain">' +
									'<label for="filters">Auto-load active charts</label>' +
									'<select name="filters" id="flip-2" data-role="slider" disabled="disabled">' +
										'<option value="off">Off</option>' +
										'<option value="on">On</option>' +
									'</select>' +
								'</li>' +
								'<li class="field-contain">' +
									'<fieldset data-role="controlgroup">' +
													'<legend>Search in</legend>' +
													'<input type="radio" name="radio1" id="radio1_0" value="IBMREQ001" onchange="changeSearchIn(this.value)" checked="checked"/>' +
													'<label for="radio1_0">Americas</label>' +
													'<input type="radio" name="radio1" id="radio1_1" value="IBMREQ002" onchange="changeSearchIn(this.value)"/>' +
													'<label for="radio1_1">EU Europe</label>' +
													'<input type="radio" name="radio1" id="radio1_2" value="IBMREQ003" onchange="changeSearchIn(this.value)"/>' +
													'<label for="radio1_2">Asia Pacific</label>' +
									'</fieldset>' +
								'</li>' +
								'<li class="field-contain"><a href="#" onclick="javascript:Authen.logout()" class="ui-btn">Logout</a></li>' +
							'</ul>' +
						'</form>' +
					'</div>';
		$(this).append(prefsAnchor);
		$(this).append(prefs);
		
		
	});
});



function drList(){
	
	var username = $('#j_username').val();
	//alert (username);
	
	//window.alert(username, null, null);
	//alert ("going to adapter",null, Messages.application_title);
	
	
	var invocationData = {
            adapter : 'bluepagesapi',
		    procedure : 'getmanager',
		    parameters : [username]
        };

    WL.Client.invokeProcedure(invocationData,{
        onSuccess : drlistSuccess,
        onFailure : drlistFailure,
    });
   
}
function drlistSuccess(response){
	
	
var result=response.invocationResult;
ismanagerflag=result.ismanager;
name=result.givenname;

	var entry=result.managerapi.search.entry;
	var attribute=entry[0].attribute;

	for(var i=0;i<attribute.length;i++){
		 if(attribute[i].name =='notesemail'){
			notesid=attribute[i].value;
		}

	}
	 var res=notesid.toString().split("=");
	 var res1=res[1].split("/");
	 var res11=res1[0].toString().split(" ");
	 var res12="";
	 var j=0;
	 for(var i=0;i<res11.length;i++){
		 j =i+1;
		res12 +=res11[i];
		if(j<res11.length){
			res12 +=" ";
		}
	 }
	 
	 
	 
	 var res2=res[2].split("O");
	 var res3=res[3].split("@");
	 var res13=res12.replace(" ","%20");
	 
	 var finalnotesid=res13+'/'+res2[0]+res3[0];
	 
	 
	 var n=$("#j_username").val();
	 var m=$("#j_password").val();
	 
	 var invocationResult = {
				adapter: "think40",
				procedure: 'getStories',
				parameters: [finalnotesid,n,m]
		};

		WL.Client.invokeProcedure(invocationResult, {
			onSuccess : getthinkSuccess,
			onFailure : getthinkfailure
		});	 
	 }
function drlistFailure(response){
	BonD.busierHide('login');
	window.alert("failed", null, null);
	 }
function getthinkSuccess(response){
	var result=response.invocationResult;
	var directReports=result.directReports;
	var manager=result.manager;
	var length=directReports.length;
	var username=$('#j_username').val();
	var learninghours='';
	
	if(ismanagerflag=='N'){
		
		for (var i=0; i<length;i++){
			if(directReports[i].email== username){
				learninghours=directReports[i].learningHrs;
				
			}
		}
		$('#givenname').html("Hi "+name);
		$("#completedhours").html("Completed: "+learninghours+" hrs.");
		if(learninghours >=40){
			learninghours=40;
		}
		else{
			$("#successmessage").hide();
		}
		var percentage=Math.round((learninghours/40)*100);
//		$("#completedprogress").html('<div class="progress-bar  progress-bar-success" role="progressbar" aria-valuenow="'
//				+percentage+'" aria-valuemin="0" aria-valuemax="100" style="width:'+percentage+'%">'+percentage+' % Complete</div>');
		$("#completedprogress").html('<span style="width:'+percentage+'%"></span>');
		$("#employeetab").remove();
		$("#two").remove();
		$("#draggregate").hide();
	}
	else{
		var managerlearning=manager.learningHrs;
		$('#givenname').html("Hi "+name);
		$("#completedhours").html("Completed: "+managerlearning+" hrs.");
		if(managerlearning >=40){
			managerlearning=40;
		}
		else{
			$("#successmessage").hide();
		}
		var percentage=Math.round((managerlearning/40)*100);
        $("#completedprogress").html('<span style="width:'+percentage+'%"></span>');
        
        
        var totallearning = 0;
        var learninghours1='';
        for (var i=0; i<length;i++){
			reporteename = directReports[i].fullName;
			learninghours1=directReports[i].learningHrs;
			if(learninghours1>=40){
				learninghours=40;
			}		
			else{
				learninghours=learninghours1;	
			}
			var percentage1=Math.round((learninghours/40)*100);
			$("#employeecontent").append('<li data-theme="d"><h2>'+reporteename
					+'</h2><p>Completed:'+learninghours1
					+'  hrs.</p><div class="meter"><span style="width:'
					+percentage1
					+'%"></span></div><div class="spr10"></div><p>Status: Completed, '+percentage1+'%</p></li>');
			totallearning += learninghours;
		}
        var overallpercentage=Math.round(((totallearning/(length*40))*100));
        $("#drpercent").html("Overall Aggregate DR: "+overallpercentage+"%");
        $("#drmeter").html('<span style="width:'+overallpercentage+'%"></span>');
	}
	$.mobile.changePage("#dashboard",{ changeHash: false,
		allowSamePageTransition : true,
	      transition              : 'none',
	      showLoadMsg             : false,
	      reloadPage              : false
		}); 
	BonD.busierHide('login');
	//BonD.busierHide('login');
	//$('#login').hide();
	//$('#dashboard').show();
	
}
function getthinkfailure(response){
	BonD.busierHide('login');
	alert("failed to get think40 hours");
}

function logout(){
	$.confirm({
	    title: 'Logout',
	    content: 'Are you sure you want to logout?',
	    confirmButton: 'Yes',
	    cancelButton: 'No',
	    theme: 'holodark',
	    confirm: function(){
	    	WL.ClientMessages.loading = "Loading";
	    	busy=new WL.BusyIndicator ();
	    	busy.show();
	    	var options={
	    			onSuccess : WL.Client.reloadApp,
	    	};
	    	WL.Client.logout(BonD.WL_AUTHEN_REALM,options);
	    },
	    cancel: function(){
	        // do something when No is clicked.
	    }
	});
}

/* JavaScript content from js/main.js in folder ipad */
// This method is invoked after loading the main HTML and successful initialization of the Worklight runtime.
function wlEnvInit(){
    wlCommonInit();
    // Environment initialization code goes here
}