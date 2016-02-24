/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
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
    private VizType type;
    private Collection<YDSFacet> facets;

    public Embedding(Object project_id, VizType type, Collection<YDSFacet> facets) {
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
        VizType t;
        Collection<YDSFacet> fets;
        pid = dbo.get("project_id");
        t = VizType.valueOf((String) dbo.get("type"));
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
