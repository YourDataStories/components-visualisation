/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class YDSRoutePoints {

    private List<GeoPoint> route= new ArrayList<GeoPoint>();

    public YDSRoutePoints() {

    }

    public void addPoint(String lat, String lng) {
        GeoPoint newPoint = new GeoPoint(Float.parseFloat(lat),Float.parseFloat(lng));
        route.add(newPoint);
    }

    public List<GeoPoint> getRoute() {
        return route;
    }

    public void setRoute(List<GeoPoint> route) {
        this.route = route;
    }

    @Override
    public String toString() {
        return "YDSRoutePoints{" + "route=" + route + '}';
    }

    public String toJson() {
        return new Gson().toJson(this, this.getClass());
    }

}
