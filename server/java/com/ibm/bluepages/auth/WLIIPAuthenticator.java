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
package com.ibm.bluepages.auth;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.worklight.server.auth.api.AuthenticationResult;
import com.worklight.server.auth.api.AuthenticationStatus;
import com.worklight.server.auth.api.MissingConfigurationOptionException;
import com.worklight.server.auth.api.UserIdentity;
import com.worklight.server.auth.api.WorkLightAuthenticator;

/**
 * This class is used to process the authentication, it implemented follow the instruction of Worklight custom login module.
 * @author nghiemvanviet
 * @version 1.0 May 20, 2014
 * Worklight IIP authenticator
 */
public class WLIIPAuthenticator implements WorkLightAuthenticator{
	private static final Logger logger = Logger.getLogger(WLIIPAuthenticator.class.getName());

	/**
	 * Authentication data mapping
	 */
	private Map<String, Object> authenticationData = null;
	
	/**
	 * Initialize this authenticator with the given configuration options.
	 * @param options the configured options
	 */
	public void init(Map<String, String> options) throws MissingConfigurationOptionException {
		logger.fine("WLIIPAuthenticator initialized");
	}

	/**
	 * Try to process the given request (send challenge on fresh sessions, extract login data from response, etc.).
	 */
	public AuthenticationResult processRequest(HttpServletRequest request, HttpServletResponse response, boolean isAccessToProtectedResource) throws IOException, ServletException {
		logger.fine("processRequest");
		
		if (request.getRequestURI().contains("custom_security_check")){
			String serial = request.getParameter("j_serial");
			String os = request.getParameter("j_os");
			// Checking device security compliance using MAS service
			if (serial != null && serial.length() > 0 && os != null && os.length() > 0) {
				DeviceSecurityChecker.SecurityResponse resp = DeviceSecurityChecker.performCheck(serial);
				if (resp != DeviceSecurityChecker.SecurityResponse.COMPLIANT) {
					String jsonMessage = "{\"authStatus\":\"required\", \"errorMessage\":\""+DeviceSecurityChecker.getMessage(resp)+"\"}";
					this.sendResponse(request, response, jsonMessage);
					return AuthenticationResult.createFrom(AuthenticationStatus.CLIENT_INTERACTION_REQUIRED);
				}
			}
			
			String username = request.getParameter("j_username");
			String password = request.getParameter("j_password");
			if (null != username && null != password && username.length() > 0 && password.length() > 0){
				authenticationData = new HashMap<String, Object>();
				authenticationData.put("username", username);
				authenticationData.put("password", password);
				logger.fine("processRequest-SUCCESS");
				return AuthenticationResult.createFrom(AuthenticationStatus.SUCCESS);
			} else {
				String jsonMessage = "{\"authStatus\":\"required\", \"errorMessage\":\"Please enter username and password\"}";
				this.sendResponse(request, response, jsonMessage);
				logger.fine("processRequest-CLIENT_INTERACTION_REQUIRED");
				return AuthenticationResult.createFrom(AuthenticationStatus.CLIENT_INTERACTION_REQUIRED);
			}
		} 
		
		if (!isAccessToProtectedResource) {
			logger.fine("processRequest-REQUEST_NOT_RECOGNIZED");
			return AuthenticationResult.createFrom(AuthenticationStatus.REQUEST_NOT_RECOGNIZED);
		}
		
		String jsonMessage = "{\"authStatus\":\"required\"}";
		this.sendResponse(request, response, jsonMessage);
		logger.fine("processRequest-CLIENT_INTERACTION_REQUIRED");
		return AuthenticationResult.createFrom(AuthenticationStatus.CLIENT_INTERACTION_REQUIRED);
	}

	/**
	 * This method is invoked after authentication success. It is used to add data to the response after the authentication is successful.
	 */
	public boolean changeResponseOnSuccess(HttpServletRequest request, HttpServletResponse response) throws IOException {
		logger.fine("changeResponseOnSuccess");
		if (request.getRequestURI().contains("custom_security_check")){
			String jsonMessage = "{\"authStatus\":\"complete\"}";
			this.sendResponse(request, response, jsonMessage);
			return true;
		}
		return false;
	}

	/**
	 * Decide what to do on the authentication failure. 
	 * The authenticator may either return AuthenticationResult.createFrom(AuthenticationStatus) with AuthenticationStatus.FAILURE, or start the login protocol again.
	 */
	public AuthenticationResult processAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, 
			String errorMessage) throws IOException, ServletException {
		logger.fine("processAuthenticationFailure-CLIENT_INTERACTION_REQUIRED");
		String jsonMessage = "{\"authStatus\":\"required\", \"errorMessage\":\"" + errorMessage + "\"}";
		this.sendResponse(request, response, jsonMessage);
		return AuthenticationResult.createFrom(AuthenticationStatus.CLIENT_INTERACTION_REQUIRED);
	}

	/**
	 * Process the request when the session is already authenticated. 
	 * This method is invoked for each request from an already authenticated session. 
	 * The authenticators can use this hook to perform the necessary handshake in the middle of the session, or re-authenticate if the user re-logged into environment.
	 */
	public AuthenticationResult processRequestAlreadyAuthenticated(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		logger.fine("processRequestAlreadyAuthenticated-REQUEST_NOT_RECOGNIZED");
		return AuthenticationResult.createFrom(AuthenticationStatus.REQUEST_NOT_RECOGNIZED);
	}

	/**
	 * Used by a Login Module to get the credentials collected by an authenticator.
	 */
	public Map<String, Object> getAuthenticationData() {
		logger.fine("getAuthenticationData");
		return authenticationData;
	}
	
	/**
	 * request to proceed
	 */
	public HttpServletRequest getRequestToProceed(HttpServletRequest request, HttpServletResponse response, UserIdentity userIdentity)	throws IOException {
		logger.fine("getRequestToProceed");
		return null;
	}

	/**
	 * Clone the worklight authenticator.
	 */
	@Override
    public WorkLightAuthenticator clone() throws CloneNotSupportedException {
		logger.fine("clone");
		WLIIPAuthenticator otherAuthenticator = (WLIIPAuthenticator) super.clone();
        otherAuthenticator.authenticationData = new HashMap<String, Object>(authenticationData);
        return otherAuthenticator;
    }
	
	/**
	 * Send response to the client request.
	 * @param request
	 * @param response
	 * @param jsonMessage
	 * @throws IOException
	 */
	private void sendResponse(HttpServletRequest request, HttpServletResponse response, String jsonMessage) throws IOException {
		logger.fine("sendResponse");
		response.setContentType("application/json; charset=UTF-8");
		response.setHeader("Cache-Control", "no-cache, must-revalidate");
		logger.fine(jsonMessage);
		response.getWriter().print(jsonMessage);
	}
}
