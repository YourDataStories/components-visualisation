/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.util.test.httpPostGetPut;
import com.google.gson.Gson;
import gr.demokritos.iit.ydsapi.model.YDSGeoPoints;
import gr.demokritos.iit.ydsapi.model.YDSRoutePoints;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.commons.io.FileUtils;
import org.apache.http.HttpResponse;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
@Path("yds/geo/")
@Produces(MediaType.APPLICATION_JSON)
public class GeoEditing {

    @Path("route/save/{projectId}")
    @POST
    public String saveGeoRoute(
            @PathParam("projectId") String projectId,
            @FormParam("geoData") String geoData
    ) {
        save_GeoObj(geoData, projectId);
        return new Gson().toJson("save complete", String.class);
    }

    @Path("route/{projectId}")
    @GET
    public String getGeoRoute(
            @PathParam("projectId") String projectId
    ) {

        return read_GeoObj(projectId);
    }

    @Path("route")
    @POST
    public String getRoutePoints(
            @FormParam("geoData") String geoData
    ) {
        YDSGeoPoints geoPoints = new YDSGeoPoints().unpack(geoData);

        return getRouteFromOpenrouteService(geoPoints.startPointToString(),
                geoPoints.viaPointsToString(), geoPoints.endPointToString());
    }

    private String getRouteFromOpenrouteService(String startPoint,
            String viaPoints, String endPoint) {

        YDSRoutePoints routePoints = new YDSRoutePoints();

        String URL = "http://openls.geog.uni-heidelberg.de/route?"
                + "start=" + startPoint + "&"
                + "end=" + endPoint + "&"
                + "via=" + viaPoints + "&"
                + "lang=en&"
                + "distunit=KM&"
                + "routepref=Car&"
                + "weighting=Fastest&"
                + "avoidAreas=&"
                + "useTMC=false&"
                + "noMotorways=false&"
                + "noTollways=false&"
                + "noUnpavedroads=false&"
                + "noSteps=false&"
                + "noFerries=false&"
                + "instructions=false";

        httpPostGetPut http = new httpPostGetPut();
        try {
            HttpResponse response = http.execGet(URL);
            if (response.getStatusLine().getStatusCode() == 200) {
                BufferedReader rd = new BufferedReader(
                        new InputStreamReader(response.getEntity().getContent()));

                String line = "";
                boolean flag = false;
                while ((line = rd.readLine()) != null) {
                    if (line.trim().startsWith("<gml:LineString")) {
                        flag = true;
                    }
                    if (line.trim().startsWith("<gml:pos>") && flag) {
                        String[] tmp = line.split("<gml:pos>");
                        String[] tmp2 = tmp[1].split("</gml:pos>");
                        String[] cordinates = tmp2[0].split("\\s+");
                        routePoints.addPoint(cordinates[1], cordinates[0]);
                    }
                }
            }

        } catch (Exception ex) {
            Logger.getLogger(GeoEditing.class.getName()).log(Level.SEVERE, null, ex);
        }

        return routePoints.toJson();
    }

    private String read_GeoObj(String projectId) {
        String path = "";
        URL url = getClass().getResource("/");
        path = url.getPath() + "saved_GeoObj_" + projectId + ".json";

        try {
            return FileUtils.readFileToString(new File(path));
        } catch (IOException ex) {
            Logger.getLogger(Search.class.getName()).log(Level.SEVERE, "File not found");
            return "";
        }
    }

    private void save_GeoObj(String geoObj, String projectId) {
        String path = "";
        URL url = getClass().getResource("/");
        path = url.getPath() + "saved_GeoObj_" + projectId + ".json";

        try {
            FileUtils.write(new File(path), geoObj, false);
        } catch (IOException ex) {
            Logger.getLogger(Search.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

}
