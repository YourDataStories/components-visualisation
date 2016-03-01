/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.rest;

import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import gr.demokritos.iit.ydsapi.couch.CouchCallerImpl;
import gr.demokritos.iit.ydsapi.couch.ESPAParser;
import gr.demokritos.iit.ydsapi.couch.ResultSanitizer;
import gr.demokritos.iit.ydsapi.responses.BaseResponse;
import static gr.demokritos.iit.ydsapi.storage.YDSAPI.LOGGER;
import gr.demokritos.iit.ydsapi.util.Configuration;
import gr.demokritos.iit.ydsapi.util.test.httpPostGetPut;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Variant;
import org.apache.commons.io.FileUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.jboss.resteasy.client.ClientResponse;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
@Path("yds/api/couch/")
public class CouchWrapper {

    private static final Locale LOCALE_GR = new Locale("el", "gr");

    @Path("visualization")
    @POST
    public String search(
            @FormParam("project_id") String projectId,
            @FormParam("viz_type") String visualizationType
    ) {
//        String resp = read_visualizationFromCouchDB(visualizationType, projectId);
//        return (resp == null || (resp.contains("not_found") && resp.contains("missing")))
//                ? read_visualization(visualizationType, projectId)
//                : resp;
        return read_visualization(visualizationType, projectId);
    }

    @Path("espa/{project_id}/{table_type}")
    @GET
    public Response getEspa(
            @PathParam("project_id") String projectId,
            @PathParam("table_type") @DefaultValue("projectInfo") String table_type
    ) {
        Response.ResponseBuilder resp;
        try {
            String str_res = readESPAVisualizationFromCouchDB(table_type, projectId);
            resp = Response.status(Response.Status.OK);
            resp.entity(str_res);
        } catch (Exception ex) {
            String err = ex.getMessage() == null ? ex.toString() : ex.getMessage();
            BaseResponse br = new BaseResponse(BaseResponse.Status.ERROR, err);
            resp = Response.status(Response.Status.INTERNAL_SERVER_ERROR);
            resp.entity(br.toJSON());
            LOGGER.severe(err);
        }
        resp.variant(new Variant(MediaType.APPLICATION_JSON_TYPE, Locale.ENGLISH, Configuration.ENCODING_UTF_8));
//        resp.variant(new Variant(MediaType.APPLICATION_JSON_TYPE, LOCALE_GR, Configuration.ENCODING_UTF_8));
        return resp.build();
    }

    private String readESPAVisualizationFromCouchDB(String type, String projectId) throws Exception {
        ClientResponse res = null;
        String entity;
        ESPAParser parser;
        String json_res = null;
        try {
            res = (ClientResponse) CouchCallerImpl.getInstance().callCouchGet(null, null, projectId, String.class);
            entity = (String) res.getEntity();
            parser = new ESPAParser(entity, projectId);
            Object result = parser.getContent(type);
            TypeToken type_token = new TypeToken<List<Map<String, Object>>>() {
            };
            if (projectId != null && !type.equalsIgnoreCase("projectmap")) {
                result = new ResultSanitizer().sanitize((List<Map<String, Object>>) result);
            }
            // sanitize result 
            json_res
                    = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create().toJson(result, type_token.getType());
        } finally {
            if (res != null) {
                res.releaseConnection();
            }
        }
        return json_res;
    }

    private String read_visualizationFromCouchDB(String type, String projectId) {
        String path = "";
//        String url = "http://localhost:5984/project_info";
        String url = "http://localhost:25984/project_info";
        path = url.concat("/projectid=").concat(projectId);
        httpPostGetPut p = null;
        HttpResponse res;
        HttpEntity entity;
        try {
            p = new httpPostGetPut();
            res = p.execGet(path);
            entity = res.getEntity();
            String entity_response = EntityUtils.toString(entity, Charset.forName(Configuration.ENCODING_UTF_8));
//            System.out.println(entity_response);
            return entity_response;
        } catch (IOException ex) {
            Logger.getLogger(CouchWrapper.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        } catch (Exception ex) {
            Logger.getLogger(CouchWrapper.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        } finally {

        }
    }

    private String read_visualization(String type, String projectId) {
        String path = "";
        URL url = getClass().getResource("/");

        switch (type) {
            case "map":
                path = url.getPath() + "saved_GeoObj_" + projectId + ".json";
                break;
            case "grid":
                path = url.getPath() + "response_visualization_grid.json";
                break;
            case "line":
                path = url.getPath() + "response_visualization_line.json";
                break;
            case "bar":
                path = url.getPath() + "response_visualization_bar.json";
                break;
            case "pie":
                path = url.getPath() + "response_visualization_pie.json";
                break;
            case "info":
                path = url.getPath() + "response_visualization_info.json";
                break;
        }

        try {
            return FileUtils.readFileToString(new File(path));
        } catch (IOException ex) {
            Logger.getLogger(Search.class.getName()).log(Level.SEVERE, null, ex);
            return "ERROR: " + ex.getMessage();
        }
    }
}
