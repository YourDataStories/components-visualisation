package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.ComponentType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import java.util.Collection;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class EmbedLoadResponse extends BaseResponse implements IResponse {

    private Embedding embedding;

    public EmbedLoadResponse(Collection<YDSFacet> facets, Object project_id, ComponentType type, Object view_type, Object lang, Status status, String message) {
        super(status, message);
        this.embedding = new Embedding(project_id, type, facets, view_type, lang);
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
