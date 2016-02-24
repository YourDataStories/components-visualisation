/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.util.clienttest;

import com.google.gson.Gson;
import gr.demokritos.iit.ydsapi.util.test.httpPostGetPut;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.core.Response;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class TestClientCouchWrapper {

    public static void main(String[] args) throws Exception {

//        testPost();
//        String res = execGet("http://localhost:8084/YDSAPI/yds/embed/get/565ec7c11d7b8ac30c225d78");
//        String res = execGet("http://localhost:8084/YDSAPI/yds/embed/get/565ec7c11d7b8ac30c225d75");
//        System.out.println(res);
//        String res = execGet("http://localhost:8084/YDSAPI/yds/api/couch/espa/200122");
        testPost();
    }

    private static void testGet() throws Exception {
        httpPostGetPut qqomg = new httpPostGetPut();
        String url = "http://localhost:8084/YDSAPI/yds/embed/get/565ec7c11d7b8ac30c225d75";
    }

    private static void testPost() throws Exception {
        httpPostGetPut qqomg = new httpPostGetPut();
        String url = "http://localhost:8084/YDSAPI/yds/api/couch/visualization/";
        Map<String, String> params = new HashMap();
        params.put("project_id", "1");
        params.put("viz_type", "map");
        qqomg.execPost(url, params);
    }

    private static String execGet(String url) {
        HttpGet request = null;
        HttpClient client;
        try {
            client = new DefaultHttpClient();
            // init a http request
            request = new HttpGet(url);
            // create a response handler
            ResponseHandler<String> responseHandler = new ResponseHandler() {
                @Override
                public String handleResponse(final HttpResponse response)
                        throws HttpResponseException, IOException {

                    StatusLine statusLine = response.getStatusLine();
                    if (statusLine.getStatusCode() >= 300) {
                        throw new HttpResponseException(statusLine.getStatusCode(),
                                statusLine.getReasonPhrase());
                    }
                    System.out.println(statusLine.getStatusCode());

                    HttpEntity entity = response.getEntity();
                    if (entity != null) {
                        String sMed = EntityUtils.toString(entity, Charset.forName("UTF-8"));
                        return sMed;
                    } else {
                        return null;
                    }
                }
            };
            // get the response
            String response = client.execute(request, responseHandler);
            return response;
        } catch (Exception ex) {
            System.out.println("Error: " + ex.getMessage());
            return null;
        } finally {
            if (request != null) {
                request.releaseConnection();
            }
        }
    }

}
