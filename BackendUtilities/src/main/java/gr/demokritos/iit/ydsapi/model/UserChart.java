package gr.demokritos.iit.ydsapi.model;

import com.google.gson.*;

import java.lang.reflect.Type;

/**
 * Like Basket Item but can only be a visualization (not dataset) and also has an embed code
 */
public class UserChart {
    private String id;
    private String chartId;
    private String title;
    private String description;
    private String thumbnailUrl;
    private Object embedCode;

    public UserChart(String id, String chartId, String title, String description, String thumbnailUrl, Object embedCode) {
        this.id = id;
        this.chartId = chartId;
        this.title = title;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.embedCode = embedCode;
    }

    public UserChart() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getChartId() {
        return chartId;
    }

    public void setChartId(String chartId) {
        this.chartId = chartId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public Object getEmbedCode() {
        return embedCode;
    }

    public void setEmbedCode(Object embedCode) {
        this.embedCode = embedCode;
    }

    public JsonElement toJSONElement() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(BasketItem.class, new UserChart.UserChartSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJsonTree(this);
    }

    public static final String FLD_ID = "id";
    public static final String FLD_CHARTID = "chart_id";
    public static final String FLD_TITLE = "title";
    public static final String FLD_DESCRIPTION = "description";
    public static final String FLD_THUMBNAILURL = "thumbnail_url";
    public static final String FLD_EMBEDCODE = "embed_code";

    /**
     * Helper class to serialize as needed in the API
     */
    class UserChartSerializer implements JsonSerializer<UserChart> {

        @Override
        public JsonElement serialize(UserChart t, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();

            jsonObject.addProperty(UserChart.FLD_ID, t.getId().toString());
            jsonObject.addProperty(UserChart.FLD_CHARTID, t.getChartId());
            jsonObject.addProperty(UserChart.FLD_TITLE, t.getTitle());
            jsonObject.addProperty(UserChart.FLD_DESCRIPTION, t.getDescription());
            jsonObject.addProperty(UserChart.FLD_THUMBNAILURL, t.getThumbnailUrl());
            jsonObject.addProperty(UserChart.FLD_EMBEDCODE, t.getEmbedCode().toString());

            return jsonObject;
        }
    }
}
