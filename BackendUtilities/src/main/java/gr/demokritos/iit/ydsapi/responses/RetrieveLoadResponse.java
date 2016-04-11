package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import gr.demokritos.iit.ydsapi.model.BasketItem;
import java.lang.reflect.Type;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class RetrieveLoadResponse implements IResponse {

    private final boolean success;
    private final String message;
    private final BasketItem item;

    public RetrieveLoadResponse(boolean success, String message, BasketItem itemArg) {
        this.success = success;
        this.message = message;
        this.item = itemArg;
    }

    public RetrieveLoadResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.item = null;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder()
                .setPrettyPrinting()
                .registerTypeHierarchyAdapter(RetrieveLoadResponse.class, new RetrieveLoadResponseSerializer())
                .create()
                .toJson(this);
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

    public BasketItem getItem() {
        return item;
    }

    @Override
    public String toString() {
        return "RetrieveLoadResponse{" + "success=" + success + ", message=" + message + ", item=" + item + "}";
    }

    class RetrieveLoadResponseSerializer implements JsonSerializer<RetrieveLoadResponse> {

        @Override
        public JsonElement serialize(RetrieveLoadResponse t, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("success", t.isSuccess());
            jsonObject.addProperty("message", t.getMessage());
            BasketItem bi = t.getItem();
            if (bi != null) {
                jsonObject.add("data", bi.toJSONElement());
            } else {
                jsonObject.add("data", new JsonObject());
            }
            return jsonObject;
        }
    }

}
