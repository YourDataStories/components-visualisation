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

    public Embedding(Object project_id, ComponentType type, Collection<YDSFacet> facets) {
        this.project_id = project_id;
        this.type = type;
        this.facets = facets;
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
        pid = dbo.get("project_id");
        t = ComponentType.valueOf(((String) dbo.get("type")).toUpperCase());
        fets = extractFacets((List<DBObject>) dbo.get("facets"));
        return new Embedding(pid, t, fets);
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
