/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.VizType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import java.util.Collection;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class EmbedLoadResponse extends BaseResponse implements IResponse {

    private Embedding embedding;

    public EmbedLoadResponse(Collection<YDSFacet> facets, Object project_id, VizType type, Status status, String message) {
        super(status, message);
        this.embedding = new Embedding(project_id, type, facets);
    }

    public EmbedLoadResponse(Embedding embedding) {
        super();
        if (embedding == null) {
            setStatus(Status.NOT_EXISTS);
            setMessage("hash provided not found");
        }
        this.embedding = embedding;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, EmbedLoadResponse.class);
    }

}
