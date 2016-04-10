package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class RetrieveLoadResponse implements IResponse {

    private final boolean success;
    private final String message;
    private final Object[] data;

    public RetrieveLoadResponse(boolean success, String message, Object[] dataArg) {
        this.success = success;
        this.message = message;
        this.data = dataArg;
    }

    public RetrieveLoadResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.data = new Object[0];
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().serializeNulls().create().toJson(this);
    }

    @Override
    public JsonElement toJSONElement() {
        throw new UnsupportedOperationException("Not supported.");
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Object[] getData() {
        return data;
    }

    @Override
    public String toString() {
        return "RetrieveLoadResponse{" + "success=" + success + ", message=" + message + ", data=" + data + "}";
    }
}
