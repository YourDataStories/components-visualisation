package gr.demokritos.iit.ydsapi.model;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class GeoPoint {
    
    private float lat;
    private float lng;

    public GeoPoint() {
    }
    public GeoPoint(float lat ,float lng) {
        this.lat=lat;
        this.lng=lng;
    }

    public float getLat() {
        return lat;
    }

    public void setLat(float lat) {
        this.lat = lat;
    }

    public float getLng() {
        return lng;
    }

    public void setLng(float lng) {
        this.lng = lng;
    }

    @Override
    public String toString() {
        return "{" + "lat:" + lat + ", lng:" + lng + '}';
    }

}
