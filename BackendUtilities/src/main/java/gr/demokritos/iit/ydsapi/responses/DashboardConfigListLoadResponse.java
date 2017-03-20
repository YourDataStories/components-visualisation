package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.*;
import gr.demokritos.iit.ydsapi.model.DashboardConfig;

import java.lang.reflect.Type;
import java.util.List;

public class DashboardConfigListLoadResponse extends BaseResponse implements IResponse {
    private final List<DashboardConfig> items;

    public DashboardConfigListLoadResponse(Status status, String message, List<DashboardConfig> items) {
        super(status, message);
        this.items = items;
    }

    public DashboardConfigListLoadResponse(List<DashboardConfig> items) {
        super();

        if (items == null || items.isEmpty()) {
            setStatus(Status.NOT_EXISTS);
            setMessage("no dashboard configuration items found");
        } else {
            setStatus(Status.OK);
        }

        this.items = items;
    }

    @Override
    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(DashboardConfigListLoadResponse.class, new DashboardConfigListLoadResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();

        return gson.toJson(this);
    }

    @Override
    public JsonElement toJSONElement() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public class DashboardConfigListLoadResponseSerializer implements JsonSerializer<DashboardConfigListLoadResponse> {
        @Override
        public JsonElement serialize(DashboardConfigListLoadResponse r, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("status", r.getStatus().toString());
            jsonObject.addProperty("msg", r.getMessage());
            final JsonArray jsonItems = new JsonArray();
            if (r.items != null && !r.items.isEmpty()) {
                // Add items
                for (final DashboardConfig dc : r.items) {
                    final JsonElement jsonI = dc.toJSONElement();
                    jsonItems.add(jsonI);
                }
            }
            jsonObject.add("items", jsonItems);

            return jsonObject;
        }
    }
}
