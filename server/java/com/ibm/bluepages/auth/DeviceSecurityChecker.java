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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

/**
 * DeviceSecurityChecker, To perform the device security check whether it is compliant with MaaS360.
 * @author nghiemvanviet
 * @version 1.0 May 20, 2014
 * Device security checker
 */
public class DeviceSecurityChecker {
	private static final Logger logger = Logger.getLogger(DeviceSecurityChecker.class.getName());
	
	/**
	 * The security service url.
	 */
	private static final String SECURITY_SERVICE_URL = "http://w3-01.ibm.com/ibmweb/mobileauth/services.cio?method=securityStatus&format=json";
	
	/**
	 * Invalid pattern for checking device security status
	 */
	private static final String INVALID_PATTERN = "(\"invalid uniqueid\")|(\"invalid parameter\")";
	/**
	 * Allow security pattern for checking device security status
	 */
	private static final String ALLOW_PATTERN = "(\"access\":\"allow\")|(\"@access\":\"allow\")";
	/**
	 * Compliant pattern for checking device security status
	 */
	private static final String COMPLIANT_PATTERN = "(\"securitypolicy\":\"compliant\") | (\"@securitypolicy\":\"compliant\")";
	
	/**
	 * Defined the SecurityResponse results as enum class
	 */
	public static enum SecurityResponse {
		COMPLIANT, NONCOMPLIANT_SECURITY_POLICY, ACCESS_DENIED, INVALID_DEVICE_ID, INVALID_RESPONSE
	};
	
	/**
	 * Check access field only if it true otherwise have to check all the security policy fields.
	 */
	private static boolean checkAccessOnly = true;

	/**
	 * Whether to check only access field or not
	 */
	public static boolean isCheckAccessOnly() {
		return checkAccessOnly;
	}

	/**
	 * Set check access field only.
	 * @param checkAccessOnly
	 */
	public static void setCheckAccessOnly(boolean checkAccessOnly) {
		DeviceSecurityChecker.checkAccessOnly = checkAccessOnly;
	}

	/**
	 * Perform the security check
	 * @param serial the device id
	 */
	public static SecurityResponse performCheck(String serial) {
		logger.info("performCheck, " + serial);

		// Default to invalid response
		SecurityResponse result = SecurityResponse.INVALID_RESPONSE;
		if (serial == null) {
			return result;
		}
		
		
		DefaultHttpClient httpclient = new DefaultHttpClient();
		HttpResponse httpPostResp = null;
    	InputStream ins = null;
    	HttpEntity entity = null;
		try {
			StringBuilder builder = new StringBuilder().append(SECURITY_SERVICE_URL)
					.append("&uniqueId=").append(URLEncoder.encode(String.valueOf(serial), "UTF-8"));
			
			HttpGet httpGet = new HttpGet(builder.toString());
			
        	httpPostResp = httpclient.execute(httpGet);
        	logger.info("Request : " + httpGet.getRequestLine());
        	
    		StatusLine statusLine = httpPostResp.getStatusLine();
    		logger.info("Status Line: " + statusLine.toString());
    		
    		entity = httpPostResp.getEntity();
    		ins = entity.getContent();
    		
    		int off = 0;
    		byte[] buf = new byte[1024*4];
    		ByteArrayOutputStream out = new ByteArrayOutputStream(1024*4);
    		while((off = ins.read(buf)) != -1) {
    			out.write(buf, 0, off);
    		}
    		String resp = new String(out.toByteArray()).toLowerCase();
    		out.close();
    		
    		logger.info("Security Content: " + resp);
    		
    		Pattern pattern = Pattern.compile(INVALID_PATTERN, Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
			Matcher matcher = pattern.matcher(resp);
			if (matcher.find()) {
				result = SecurityResponse.INVALID_DEVICE_ID;
				return result;
			}//if
			
			pattern = Pattern.compile(ALLOW_PATTERN, Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
			matcher = pattern.matcher(resp);
			if (matcher.find()) {
				if (isCheckAccessOnly()) {
					result = SecurityResponse.COMPLIANT;
				} else {
					pattern = Pattern.compile(COMPLIANT_PATTERN, Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
					matcher = pattern.matcher(resp);
					if (matcher.find()) {
						result = SecurityResponse.COMPLIANT;
					} else {
						result = SecurityResponse.NONCOMPLIANT_SECURITY_POLICY;
					}
				}//if-else
				return result;
			}//if
			
			//other case
			result = SecurityResponse.ACCESS_DENIED;
		} catch (IOException e) {
			logger.log(Level.WARNING, "I/O error: ", e);
		} catch (Exception e) {
			logger.log(Level.WARNING, "Error: ", e);
		} 
		
		return result;
	}
	
	/**
	 * Get security status message.
	 * @param resp
	 * @return
	 */
	public static String getMessage(SecurityResponse resp) {
		switch (resp) {
		case COMPLIANT:
			return "Your device is compliant with the MaaS360 security policy";
		case NONCOMPLIANT_SECURITY_POLICY:
			return "Your device is noncompliant with the MaaS360 security policy";
		case ACCESS_DENIED:
			return "Your device has been denied access with MaaS360";
		case INVALID_DEVICE_ID:
			return "Your device is not registered with MaaS360";
		case INVALID_RESPONSE:
		default:
			return "No response from the Security Service";
		}
	}
}
