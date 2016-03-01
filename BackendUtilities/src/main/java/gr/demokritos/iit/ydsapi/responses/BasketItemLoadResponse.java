/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.Gson;
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
public class BasketItemLoadResponse extends BaseResponse implements IResponse {

    private final BasketItem item;

    public BasketItemLoadResponse(BasketItem itemArg, Status status, String message) {
        super(status, message);
        this.item = itemArg;
    }

    public BasketItemLoadResponse(BasketItem itemArg) {
        super();
        if (itemArg == null) {
            setStatus(Status.NOT_EXISTS);
            setMessage("no basket item found");
        } else {
            setStatus(Status.OK);
        }
        this.item = itemArg;
    }

    public BasketItem getItem() {
        return item;
    }

    @Override
    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(BasketItemLoadResponse.class, new BasketItemResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJson(this);
    }

    @Override
    public JsonElement toJSONElement() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(BasketItemLoadResponse.class, new BasketItemResponseSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJsonTree(this);
    }

    public class BasketItemResponseSerializer implements JsonSerializer<BasketItemLoadResponse> {

        @Override
        public JsonElement serialize(BasketItemLoadResponse t, Type typeOfSrc, JsonSerializationContext context) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("status", t.getStatus().toString());
            jsonObject.addProperty("msg", t.getMessage());
            if (t.getItem() != null) {
                // add items
                jsonObject.add("item", t.getItem().toJSONElement());
            }
            return jsonObject;
        }
    }
}
