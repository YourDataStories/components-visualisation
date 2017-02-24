package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.*;
import gr.demokritos.iit.ydsapi.model.ChartRating;

import java.lang.reflect.Type;
import java.util.List;

public class RatingListLoadResponse extends BaseResponse implements IResponse {
    private final List<ChartRating> items;

    public RatingListLoadResponse(List<ChartRating> items, Status status, String message) {
        super(status, message);
        this.items = items;
    }

    public RatingListLoadResponse(List<ChartRating> items) {
        super();

        if (items == null || items.isEmpty()) {
            setStatus(Status.NOT_EXISTS);
            setMessage("No chart ratings found");
        } else {
            setStatus(Status.OK);
        }

        this.items = items;
    }

    @Override
    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(RatingListLoadResponse.class, new RatingListLoadResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();

        Gson gson = gsonBuilder.create();

        return gson.toJson(this);
    }

    @Override
    public JsonElement toJSONElement() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    /**
     * Helper class to serialize the response
     */
    public class RatingListLoadResponseSerializer implements JsonSerializer<RatingListLoadResponse> {

        @Override
        public JsonElement serialize(RatingListLoadResponse response, Type type, JsonSerializationContext jsonSerializationContext) {
            final JsonObject jsonObject = new JsonObject();

            jsonObject.addProperty("status", response.getStatus().toString());
            jsonObject.addProperty("msg", response.getMessage());

            final JsonArray jsonItems = new JsonArray();

            if (response.items != null && !response.items.isEmpty()) {
                // Add the items
                for (final ChartRating cr : response.items) {
                    final JsonElement jsonRating = cr.toJSONElement();
                    jsonItems.add(jsonRating);
                }
            }

            jsonObject.add("items", jsonItems);

            return jsonObject;
        }
    }
}
