package gr.demokritos.iit.ydsapi.model;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.util.Objects;

public class ChartRating {
    private int rating;
    private String chartType;
    private String lang;
    private String pageUrl;
    private String projectId;
    private String viewType;
    private String userId;
    private String extraParams;

    public ChartRating(int rating, String chartType, String lang, String pageUrl, String projectId, String viewType, String userId, String extraParams) {
        this.rating = rating;
        this.chartType = chartType;
        this.lang = lang;
        this.pageUrl = pageUrl;
        this.projectId = projectId;
        this.viewType = viewType;
        this.userId = userId;
        this.extraParams = extraParams;
    }

    public ChartRating() {
    }

    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(ChartRating.class, new ChartRatingSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();

        return gson.toJson(this);
    }

    /**
     * We want only these specific fields to uniquely identify a {@link ChartRating}
     *
     * @return  Hashcode
     */
    @Override
    public int hashCode() {
        int hash = 3;

        hash = 17 * hash + Objects.hashCode(this.chartType);
        hash = 17 * hash + Objects.hashCode(this.pageUrl);
        hash = 17 * hash + Objects.hashCode(this.projectId);
        hash = 17 * hash + Objects.hashCode(this.viewType);
        hash = 17 * hash + Objects.hashCode(this.userId);
        hash = 17 * hash + Objects.hashCode(this.extraParams);

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
        final ChartRating other = (ChartRating) obj;
        if (!Objects.equals(this.chartType, other.chartType)) {
            return false;
        }
        if (!Objects.equals(this.pageUrl, other.pageUrl)) {
            return false;
        }
        if (!Objects.equals(this.projectId, other.projectId)) {
            return false;
        }
        if (!Objects.equals(this.viewType, other.viewType)) {
            return false;
        }
        if (!Objects.equals(this.userId, other.userId)) {
            return false;
        }
        return Objects.equals(this.extraParams, other.extraParams);
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
    public static final String FLD_USERID = "user_id";
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
            jsonObject.addProperty(ChartRating.FLD_USERID, cr.getUserId());
            jsonObject.addProperty(ChartRating.FLD_EXTRAPARAMS, cr.getExtraParams());

            return jsonObject;
        }
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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
