package gr.demokritos.iit.ydsapi.model;

import com.google.gson.GsonBuilder;
import com.mongodb.DBObject;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class Embedding {

    private Object project_id;
    private ComponentType type;
    private Collection<YDSFacet> facets;
    private Object view_type;
    private Object lang;

    public Embedding(Object project_id, ComponentType type, Collection<YDSFacet> facets, Object view_type, Object lang) {
        this.project_id = project_id;
        this.type = type;
        this.facets = facets;
        this.view_type = view_type;
        this.lang = lang;
    }

    public Embedding() {
    }

    /**
     * unpack an Embedding from database
     *
     * @param dbo
     * @return
     * @throws java.lang.Exception
     */
    public Embedding unpack(DBObject dbo) throws Exception {
        Object pid;
        ComponentType t;
        Collection<YDSFacet> fets;
        Object vt;
        Object lng;

        pid = dbo.get("project_id");
        t = ComponentType.valueOf(((String) dbo.get("type")).toUpperCase());
        fets = extractFacets((List<DBObject>) dbo.get("facets"));
        vt = dbo.get("view_type");
        lng = dbo.get("lang");
        return new Embedding(pid, t, fets, vt, lng);
    }

    public String toJSON() {
        return new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create().toJson(this, Embedding.class);
    }

    private Collection<YDSFacet> extractFacets(List<DBObject> list) {
        Collection<YDSFacet> res = new LinkedHashSet();
        for (DBObject each_dbo : list) {
            YDSFacet ydsfacet = extractFacet(each_dbo);
            res.add(ydsfacet);
        }
        return res;
    }

    private YDSFacet extractFacet(DBObject each_dbo) {
        YDSFacet ydsf = new YDSFacet();
        String ftype = (String) each_dbo.get("facet_type");
        List<String> fcets = (List<String>) each_dbo.get("facet_values");
        ydsf.setFacet_type(ftype);
        ydsf.setFacet_values(fcets);
        return ydsf;
    }
}
