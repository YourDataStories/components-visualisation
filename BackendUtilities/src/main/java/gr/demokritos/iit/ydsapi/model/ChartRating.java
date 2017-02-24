package gr.demokritos.iit.ydsapi.model;

import com.google.gson.*;

import java.lang.reflect.Type;

public class ChartRating {
    private int rating;
    private String chartType;
    private String lang;
    private String pageUrl;
    private String projectId;
    private String viewType;
    private String extraParams;

    public ChartRating(int rating, String chartType, String lang, String pageUrl, String projectId, String viewType, String extraParams) {
        this.rating = rating;
        this.chartType = chartType;
        this.lang = lang;
        this.pageUrl = pageUrl;
        this.projectId = projectId;
        this.viewType = viewType;
        this.extraParams = extraParams;
    }

    public ChartRating() {
    }

    public JsonElement toJSONElement() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(ChartRating.class, new ChartRating.ChartRatingSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();

        return gson.toJsonTree(this);
    }

    public static final String FLD_RATING = "rating";
    public static final String FLD_CHARTTYPE = "chart_type";
    public static final String FLD_LANG = "lang";
    public static final String FLD_PAGEURL = "page_url";
    public static final String FLD_PROJECTID = "project_id";
    public static final String FLD_VIEWTYPE = "view_type";
    public static final String FLD_EXTRAPARAMS = "extra_params";

    /**
     * Helper class to serialize as needed in the API
     */
    class ChartRatingSerializer implements JsonSerializer<ChartRating> {

        @Override
        public JsonElement serialize(ChartRating cr, Type type, JsonSerializationContext jsonSerializationContext) {
            final JsonObject jsonObject = new JsonObject();

            jsonObject.addProperty(ChartRating.FLD_RATING, cr.getRating());
            jsonObject.addProperty(ChartRating.FLD_CHARTTYPE, cr.getChartType());
            jsonObject.addProperty(ChartRating.FLD_LANG, cr.getLang());
            jsonObject.addProperty(ChartRating.FLD_PAGEURL, cr.getPageUrl());
            jsonObject.addProperty(ChartRating.FLD_PROJECTID, cr.getProjectId());
            jsonObject.addProperty(ChartRating.FLD_VIEWTYPE, cr.getViewType());
            jsonObject.addProperty(ChartRating.FLD_EXTRAPARAMS, cr.getExtraParams());

            return jsonObject;
        }
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getChartType() {
        return chartType;
    }

    public void setChartType(String chartType) {
        this.chartType = chartType;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getViewType() {
        return viewType;
    }

    public void setViewType(String viewType) {
        this.viewType = viewType;
    }

    public String getExtraParams() {
        return extraParams;
    }

    public void setExtraParams(String extraParams) {
        this.extraParams = extraParams;
    }
}
