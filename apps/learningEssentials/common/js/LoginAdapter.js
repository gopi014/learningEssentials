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
/**
 * Application Cart Adapter client access connection
 */
var LoginAdapter = {
		/**
		 * Invoke to the adapter server.
		 */
		invoke: function(adapter, procedure, parameters, onSuccess, onFailure) {
			console.log('invoke');
			var invocationData = { 'adapter': adapter, 'procedure': procedure, 'parameters': (parameters || [])/*, 'compressResponse': true*/ };
			WL.Client.invokeProcedure(invocationData, { 'onSuccess': onSuccess, 'onFailure': onFailure, 'timeout': 60000 });
		},
		/**
		 * Invoke adapter.
		 */
		_invokeAdapter: function(procedure, parameters, onSuccess, onFailure) {
			console.log('_invokeAdapter');
			this.invoke('bluePageLoginAdapter', procedure, parameters, onSuccess, onFailure);
		},
		/**
		 * Success callback when invoke adapter.
		 */
		_onSuccess : function(pageid, onSuccess, resp) {
			WL.Logger.debug('_onSuccess', resp);
			BonD.busierHide(pageid);
			var data = resp.invocationResult;
			if (data.isSuccessful) {
				if (onSuccess) {
					onSuccess(data);
				} else {
					console.log(data);
				}
			} else {
				var msg = Messages.serverInternalError;
				var errorMsg = null;
				if (data.errors && data.errors.length > 0) {
					try {
						errorMsg = '\n' + data.errors[0].substring(0, 60);
						if (data.errors[0].length > 60) errorMsg += '...';
					} catch(e){}
				}
				if (errorMsg) {
					msg += '\n' + errorMsg;
				}
				alert(msg, null, Messages.application_title);
			}
		},
		/**
		 * Faillure callback when invoke adapter.
		 */
		_onFailure : function(pageid, onFailure, resp) {
			console.log('_onFailure', resp);
			BonD.busierHide(pageid);
			if (resp && resp.status == 401) {
				return;
			}
			if (onFailure) {
				onFailure(resp);
			}
			var msg = Messages.retrievingDataError; 
			var errorMsg = null;
			if (resp) {
				if (resp.errorCode) { // errorCode: "PROCEDURE_ERROR", errorMsg: Procedure invocation error. Invocation of procedure 'getCartSearchInformation' has timed out after 30 sec.
					errorMsg = '\n' + resp.errorCode;
					try {
						errorMsg += ' \n' + resp.errorMsg.substring(0, 60);
						if (resp.errorMsg.length > 60) errorMsg += '...';
					} catch(e){}
				} else if (resp.errorMsg) {
					errorMsg = '\nReason: ' + resp.errorMsg;
				}
			}
			if (errorMsg) {
				msg += '\n' + errorMsg;
			}
			alert(msg, null, Messages.application_title);
		},
		/**
		 * Invoke adapter with busier.
		 */
		invokeAdapter: function(pageid, procedure, parameters, onSuccess, onFailure) {
			console.log('invokeAdapter');
			BonD.busierShow(pageid);
			var _succ = $.proxy(LoginAdapter._onSuccess, LoginAdapter, pageid, onSuccess);
			var _fail = $.proxy(LoginAdapter._onFailure, LoginAdapter, pageid, onFailure);
			this._invokeAdapter(procedure, parameters, _succ, _fail);
		},
		/**
		 * Invoke checkSession adapter.
		 */
		checkSession: function(pageid, parameters, onSuccess, onFailure) {
			console.log('checkSession');
			this.invokeAdapter(pageid, 'checkSession', parameters||[], onSuccess, onFailure);
		},

};

