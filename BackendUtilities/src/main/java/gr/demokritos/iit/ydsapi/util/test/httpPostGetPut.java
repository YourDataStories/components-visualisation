/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.util.test;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.commons.httpclient.util.URIUtil;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class httpPostGetPut {

    public httpPostGetPut() {
    }

    public String execPost(String baseURL, Map<String, String> postParams) throws Exception {

        String url = baseURL;

        HttpClient client = new DefaultHttpClient();
        HttpPost post = new HttpPost(url);

        // add header
        post.setHeader("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US; rv:1.7.12)");

        List<BasicNameValuePair> urlParameters = new ArrayList<BasicNameValuePair>();

        for (Map.Entry<String, String> entry : postParams.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();
            // append params
            urlParameters.add(new BasicNameValuePair(key, val));
        }

        post.setEntity(new UrlEncodedFormEntity(urlParameters, "UTF-8"));

        HttpResponse response = client.execute(post);
//        System.out.println("\nSending 'POST' request to URL : " + url);
//        System.out.println("Post parameters : " + post.toString());
//        System.out.println("Response Code : "
//                + response.getStatusLine().getStatusCode());

        BufferedReader rd = new BufferedReader(
                new InputStreamReader(response.getEntity().getContent()));

        StringBuffer result = new StringBuffer();
        String line = "";
        while ((line = rd.readLine()) != null) {
            result.append(line);
        }
        System.out.println(result.toString());
        return result.toString();
    }

    public HttpResponse execGet(String baseURL) throws Exception {

        String url = baseURL;

        HttpClient client = new DefaultHttpClient();
        HttpGet get = new HttpGet(URIUtil.encodeQuery(url));
        // add header
        get.setHeader("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US; rv:1.7.12)");

        HttpResponse response = client.execute(get);
        System.out.println(response.getEntity().toString());
        return response;
    }

    public HttpResponse execServletGet(String baseURL, Map<String, String> params) throws Exception {

        String url = params.isEmpty() ? baseURL : baseURL.concat("?");
        
        for (Map.Entry<String, String> entrySet : params.entrySet()) {
            String key = entrySet.getKey();
            String value = entrySet.getValue();
            url = url.concat(key).concat("=").concat(value).concat("&");
        }
        url = url.substring(0, url.length() -1);
        HttpClient client = new DefaultHttpClient();
        HttpGet get = new HttpGet(URIUtil.encodeQuery(url));
        // add header
        get.setHeader("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US; rv:1.7.12)");

        HttpResponse response = client.execute(get);

        return response;
    }

}
