package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class YDSGeoPoints {

    private GeoPoint startPoint;
    private GeoPoint endPoint;
    private List<GeoPoint> viaPoints;

    public YDSGeoPoints() {
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

    public String startPointToString() {
        return startPoint.getLng() + "," + startPoint.getLat();
    }

    public String endPointToString() {
        return endPoint.getLng() + "," + endPoint.getLat();
    }

    public String viaPointsToString() {
        String viaPointsString = "";
        for (int i = 0; i < viaPoints.size(); i++) {
            if (i > 0) {
                viaPointsString += " ";
            }
            viaPointsString += (viaPoints.get(i).getLng() + "," + viaPoints.get(i).getLat());
        }
        return viaPointsString;
    }

    @Override
    public String toString() {
        return "YDSGeoPoints{" + "startPoint=" + startPoint + ", endPoint=" + endPoint + ", viaPoints=" + viaPoints + '}';
    }

    public YDSGeoPoints unpack(String json) {
        return new Gson().fromJson(json, this.getClass());
    }
}
