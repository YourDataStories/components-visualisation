package gr.demokritos.iit.ydsapi.model;

import com.google.gson.*;
import org.bson.types.ObjectId;

import java.lang.reflect.Type;
import java.util.Objects;

public class DashboardConfig {
    private final ObjectId itemId;
    private final String userId;
    private final String dashboard;
    private final String title;
    private final String cookiesObject;

    public DashboardConfig(ObjectId itemId, String user_id, String dashboard, String title, String cookiesObject) {
        this.itemId = itemId;
        this.userId = user_id;
        this.dashboard = dashboard;
        this.title = title;
        this.cookiesObject = cookiesObject;
    }

    public DashboardConfig(String jsonDashboardConfig) {
        DashboardConfig dc = new GsonBuilder()
                .registerTypeAdapter(DashboardConfig.class, new DashboardConfigDeserializer())
                .create()
                .fromJson(jsonDashboardConfig, getClass());

        this.itemId = dc.getItemId();
        this.userId = dc.getUserId();
        this.dashboard = dc.getDashboard();
        this.title = dc.getTitle();
        this.cookiesObject = dc.getCookiesObject();
    }

    public ObjectId getItemId() {
        return itemId;
    }

    public String getDashboard() {
        return dashboard;
    }

    public String getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getCookiesObject() {
        return cookiesObject;
    }

    @Override
    public String toString() {
        return "DashboardConfig{" + title + ":" + cookiesObject + "}";
    }

    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(DashboardConfig.class, new DashboardConfigSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();

        return gson.toJson(this);
    }

    public JsonElement toJSONElement() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(DashboardConfig.class, new DashboardConfigSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();

        return gson.toJsonTree(this);
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 17 * hash + Objects.hashCode(this.dashboard);
        hash = 17 * hash + Objects.hashCode(this.title);
        hash = 17 * hash + Objects.hashCode(this.cookiesObject);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final DashboardConfig other = (DashboardConfig) obj;
        if (!Objects.equals(this.dashboard, other.dashboard)) {
            return false;
        }
        if (!Objects.equals(this.title, other.title)) {
            return false;
        }
        return Objects.equals(this.cookiesObject, other.cookiesObject);
    }

    public static final String FLD_ITEMID = "basket_item_id";
    public static final String FLD_OBJ_ID = "_id";
    public static final String FLD_USERID = "user_id";
    public static final String FLD_DASHBOARD = "dashboard";
    public static final String FLD_TITLE = "title";
    public static final String FLD_PARAMS = "parameters";

    /**
     * Helper class to serialize as needed in the API
     * DashboardConfig -> JsonElement
     */
    class DashboardConfigSerializer implements JsonSerializer<DashboardConfig> {
        @Override
        public JsonElement serialize(DashboardConfig dc, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();

            if (dc.getItemId() != null) {
                jsonObject.addProperty(DashboardConfig.FLD_ITEMID, dc.getItemId().toString());
            }
            jsonObject.addProperty(DashboardConfig.FLD_USERID, dc.getUserId());
            jsonObject.addProperty(DashboardConfig.FLD_DASHBOARD, dc.getDashboard());
            jsonObject.addProperty(DashboardConfig.FLD_TITLE, dc.getTitle());

            // Add parameters. Should be a JSON object, so we always parse it
            jsonObject.add(FLD_PARAMS, new JsonParser()
                    .parse(dc.getCookiesObject())
                    .getAsJsonObject());
            return jsonObject;
        }
    }

    /**
     * Helper class to deserialize a Dashboard configuration JSON String
     * JsonElement -> DashboardConfig
     */
    class DashboardConfigDeserializer implements JsonDeserializer<DashboardConfig> {
        @Override
        public DashboardConfig deserialize(JsonElement json, Type type, JsonDeserializationContext context) throws JsonParseException {
            final JsonObject jsonObject = json.getAsJsonObject();

            // Get values from JSON
            ObjectId itemId = null;
            JsonElement itemIdElem = jsonObject.get(DashboardConfig.FLD_OBJ_ID);
            if (itemIdElem != null) {
                itemId = new ObjectId(itemIdElem.getAsString());
            }
            final String userId = jsonObject.get(DashboardConfig.FLD_USERID).getAsString();
            final String dashboard = jsonObject.get(DashboardConfig.FLD_DASHBOARD).getAsString();
            final String title = jsonObject.get(DashboardConfig.FLD_TITLE).getAsString();
            final String params = jsonObject.get(DashboardConfig.FLD_PARAMS).getAsJsonObject().toString();

            return new DashboardConfig(itemId, userId, dashboard, title, params);
        }
    }
}
