/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import gr.demokritos.iit.ydsapi.model.BasketItem;
import java.lang.reflect.Type;
import java.util.List;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class BasketLoadResponse extends BaseResponse implements IResponse {

    private final List<BasketItem> items;

    public BasketLoadResponse(List<BasketItem> items, Status status, String message) {
        super(status, message);
        this.items = items;
    }

    public BasketLoadResponse(List<BasketItem> items) {
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
                .registerTypeAdapter(BasketLoadResponse.class, new BasketLoadResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJson(this);
    }

    public class BasketLoadResponseSerializer implements JsonSerializer<BasketLoadResponse> {

        @Override
        public JsonElement serialize(BasketLoadResponse t, Type typeOfSrc, JsonSerializationContext context) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("status", t.getStatus().toString());
            jsonObject.addProperty("msg", t.getMessage());
            final JsonArray jsonItems = new JsonArray();
            if (t.items != null && !t.items.isEmpty()) {
                // add items
                for (final BasketItem it : t.items) {
                    final JsonElement jsonI = it.toJSONElement();
                    jsonItems.add(jsonI);
                }
            }
            jsonObject.add("items", jsonItems);
            return jsonObject;
        }
    }
}
