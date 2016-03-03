package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class EmbedSaveResponse extends BaseResponse implements IResponse {

    private Object generated_hash;

    public EmbedSaveResponse(Object generated_hash, Status status, String message) {
        super(status, message);
        this.generated_hash = generated_hash;
    }

    public EmbedSaveResponse(Status status, String message) {
        super(status, message);
    }

    public EmbedSaveResponse() {
        super();
    }

    public Object getGenerated_hash() {
        return generated_hash;
    }

    public void setGenerated_hash(Object generated_hash) {
        this.generated_hash = generated_hash;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, EmbedSaveResponse.class);
    }

}
