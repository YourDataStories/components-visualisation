package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.*;
import gr.demokritos.iit.ydsapi.model.UserChart;

import java.lang.reflect.Type;
import java.util.List;

public class UserChartsLoadResponse extends BaseResponse implements IResponse {

    private final List<UserChart> items;

    public UserChartsLoadResponse(List<UserChart> items, Status status, String message) {
        super(status, message);
        this.items = items;
    }

    public UserChartsLoadResponse(List<UserChart> items) {
        super();
        if (items == null || items.isEmpty()) {
            setStatus(Status.NOT_EXISTS);
            setMessage("no basket items found");
        } else {
            setStatus(Status.OK);
        }
        this.items = items;
    }

    @Override
    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(UserChartsLoadResponse.class, new UserChartLoadResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJson(this);
    }

    @Override
    public JsonElement toJSONElement() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public class UserChartLoadResponseSerializer implements JsonSerializer<UserChartsLoadResponse> {

        @Override
        public JsonElement serialize(UserChartsLoadResponse t, Type typeOfSrc, JsonSerializationContext context) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("status", t.getStatus().toString());
            jsonObject.addProperty("msg", t.getMessage());
            final JsonArray jsonItems = new JsonArray();
            if (t.items != null && !t.items.isEmpty()) {
                // add items
                for (final UserChart uc : t.items) {
                    final JsonElement jsonI = uc.toJSONElement();
                    jsonItems.add(jsonI);
                }
            }
            jsonObject.add("items", jsonItems);
            return jsonObject;
        }
    }

}
