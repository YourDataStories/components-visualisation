/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.retreive;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Set;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

/**
 *
 * @author Panagiotis Giotis giotis.p@gmail.com
 */
public class BasketDatatestRetreive {

    private final static String API_PIE = "http://platform.yourdatastories.eu/api/json-ld/component/piechart.tcl?context=0&";
    private final static String API_MAP = "http://platform.yourdatastories.eu/api/json-ld/component/map.tcl?context=0&";
    private final static String API_LINE = "http://platform.yourdatastories.eu/api/json-ld/component/linechart.tcl?context=0&";
    private final static String API_GRID = "http://platform.yourdatastories.eu/api/json-ld/component/grid.tcl?context=0&";
    private final static String API_SEARCH = "http://platform.yourdatastories.eu/api/json-ld/component/search.tcl?context=0&";

    public BasketDatatestRetreive() {
    }

    public String getPieDataset(String id, String type, String lang) throws IOException {
        
        //Create the url to call the YDS API
        String url= API_PIE
                .concat("id=").concat(id)
                .concat("&type=").concat(type)
                .concat("&lang=").concat(lang);
        String response= execGet(url);
        
        return response;
    }

    public String getMapDataset(String id, String type, String lang) throws IOException {
        //Create the url to call the YDS API
        String url= API_MAP
                .concat("id=").concat(id)
                .concat("&type=").concat(type)
                .concat("&lang=").concat(lang);
        String response= execGet(url);

        return response;
    }

    public String getLineDataset(String id, String type, String lang, Set filters) throws IOException {
        //Create the url to call the YDS API
        String url= API_LINE
                .concat("id=").concat(id)
                .concat("&type=").concat(type)
                .concat("&lang=").concat(lang);
        String response= execGet(url);
        
        
        //TODO: Add filter

        return response;
    }

    public String getGridDataset(String id, String type, String lang, Set filters) throws IOException {
        //Create the url to call the YDS API
        String url= API_GRID
                .concat("id=").concat(id)
                .concat("&type=").concat(type)
                .concat("&lang=").concat(lang);
        String response= execGet(url);
        
        //TODO: Add filter
        

        return response;
    }

    public String getSearchDataset(String id, String type, String lang, Set filters) throws IOException {
        //Create the url to call the YDS API
        String url= API_SEARCH
                .concat("id=").concat(id)
                .concat("&type=").concat(type)
                .concat("&lang=").concat(lang);
        String response= execGet(url);
        
        //TODO: Add filter
        
        

        return response;
    }

    /**
     * Get data from API
     *
     * @param baseURL
     */
    private String execGet(String baseURL) throws IOException {
        BufferedReader br = null;
        String url = baseURL;

        HttpClient client = new DefaultHttpClient();
        HttpGet get = new HttpGet(url);

        // add header
//        get.setHeader("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US; rv:1.7.12)");

        HttpResponse response = client.execute(get);
        if (response.getStatusLine().getStatusCode() == 200) {
            br = new BufferedReader(
                    new InputStreamReader(response.getEntity().getContent()));
        }

        StringBuilder sb = new StringBuilder();
        String line="";
        while ((line = br.readLine()) != null) {
            sb.append(line);
         }

        return sb.toString();
    }

}
