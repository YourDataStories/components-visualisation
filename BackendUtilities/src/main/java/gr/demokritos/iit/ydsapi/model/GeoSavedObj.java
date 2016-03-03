package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class GeoSavedObj {

    private GeoPoint startPoint;
    private GeoPoint endPoint;
    private List<GeoPoint> viaPoints= new ArrayList<GeoPoint>();
    private List<GeoPoint> route= new ArrayList<GeoPoint>();
    

    public GeoSavedObj() {
    }

    public GeoPoint getStartPoint() {
        return startPoint;
    }

    public void setStartPoint(GeoPoint startPoint) {
        this.startPoint = startPoint;
    }

    public GeoPoint getEndPoint() {
        return endPoint;
    }

    public void setEndPoint(GeoPoint endPoint) {
        this.endPoint = endPoint;
    }

    public List<GeoPoint> getViaPoints() {
        return viaPoints;
    }

    public void setViaPoints(List<GeoPoint> viaPoints) {
        this.viaPoints = viaPoints;
    }

    public List<GeoPoint> getRoute() {
        return route;
    }

    public void setRoute(List<GeoPoint> route) {
        this.route = route;
    }

    @Override
    public String toString() {
        return "GeoSavedObj{" + "startPoint=" + startPoint + ", endPoint=" + endPoint + ", viaPoints=" + viaPoints + ", route=" + route + '}';
    }

    public String toJson() {
        return new Gson().toJson(this, this.getClass());
    }

    public GeoSavedObj unpack(String json) {
        return new Gson().fromJson(json, this.getClass());
    }

}
