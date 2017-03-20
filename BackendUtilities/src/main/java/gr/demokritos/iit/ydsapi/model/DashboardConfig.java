package gr.demokritos.iit.ydsapi.model;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.util.Objects;

public class DashboardConfig {
    private final String title;
    private final String cookiesObject;

    public DashboardConfig(String title, String cookiesObject) {
        this.title = title;
        this.cookiesObject = cookiesObject;
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
        if (!Objects.equals(this.title, other.title)) {
            return false;
        }
        return Objects.equals(this.cookiesObject, other.cookiesObject);
    }

    public static final String FLD_TITLE = "title";
    public static final String FLD_PARAMS = "parameters";

    /**
     * Helper class to serialize as needed in the API
     */
    class DashboardConfigSerializer implements JsonSerializer<DashboardConfig> {
        @Override
        public JsonElement serialize(DashboardConfig dc, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();

            // Add title
            jsonObject.addProperty(DashboardConfig.FLD_TITLE, dc.getTitle());

            // Add parameters. Should be a JSON object, so we always parse it
            jsonObject.add(FLD_PARAMS, new JsonParser()
                    .parse(dc.getCookiesObject())
                    .getAsJsonObject());
            return jsonObject;
        }
    }
}
