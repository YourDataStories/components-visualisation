package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;

/**
 * Response for rating save operation
 */
public class RatingSaveResponse extends BaseResponse implements IResponse {
    private Object generated_hash;

    public RatingSaveResponse(Object generated_hash, Status status, String message) {
        super(status, message);
        this.generated_hash = generated_hash;
    }

    public RatingSaveResponse(Status status, String message) {
        super(status, message);
    }

    public RatingSaveResponse() {
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
        return new GsonBuilder()
                .setPrettyPrinting()
                .disableHtmlEscaping()
                .create()
                .toJson(this, RatingSaveResponse.class);
    }

}
