/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import org.bson.types.ObjectId;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class BasketItem {

    private final String userID;
    private final String componentParentUUID;
    private final String title;
    private final ObjectId basketItemID;
    private final Set<String> tags;
    private final Set<BFilter> filters;
    private final String compType;
    private final String contentType;
    private final BasketType type;
    private final boolean priv;
    private final String lang;

    private BasketItem(Builder builder) {
        this.userID = builder.user_id;
        this.componentParentUUID = builder.component_parent_UUID;
        this.title = builder.title;
        this.basketItemID = builder.basket_item_id;
        this.tags = builder.tags;
        this.filters = builder.filters;
        this.compType = builder.component_type;
        this.contentType = builder.content_type;
        this.type = builder.type;
        this.priv = builder.isPrivate;
        this.lang = builder.lang;
    }

    public BasketItem(String jsonBasketItem) {
        BasketItem bi
                = new GsonBuilder()
                .registerTypeAdapter(BasketItem.class, new BasketItemDeserializer())
                .create()
                .fromJson(jsonBasketItem, getClass());
//        System.out.println(bi.toJSON());
        this.userID = bi.userID;
        this.componentParentUUID = bi.componentParentUUID;
        this.title = bi.title;
        this.basketItemID = bi.basketItemID;
        this.tags = bi.tags;
        this.filters = bi.filters;
        this.compType = bi.compType;
        this.contentType = bi.contentType;
        this.type = bi.type;
        this.priv = bi.priv;
        this.lang = bi.lang;
    }

    public String getUserID() {
        return userID;
    }

    public String getComponentParentUUID() {
        return componentParentUUID;
    }

    public String getTitle() {
        return title;
    }

    public ObjectId getBasketItemID() {
        return basketItemID;
    }

    public Set<String> getTags() {
        return tags;
    }

    public Set<BFilter> getFilters() {
        return filters;
    }

    public String getComponentType() {
        return compType;
    }

    public String getContentType() {
        return contentType;
    }

    public BasketType getType() {
        return type;
    }

    public boolean isPrivate() {
        return priv;
    }

    public String getLang() {
        return lang;
    }

    @Override
    public String toString() {
        return "BasketItem{" + "user_id=" + userID
                + ", component_parent_UUID=" + componentParentUUID
                + ", title=" + title
                + ", basket_item_id=" + basketItemID
                + ", tags=" + tags
                + ", filters=" + filters
                + ", component_type=" + compType
                + ", content_type=" + contentType
                + ", type=" + type
                + ", priv=" + priv
                + ", lang=" + lang + '}';
    }

    public String toJSON() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(BasketItem.class, new BasketItemSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJson(this);
    }

    public JsonElement toJSONElement() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder
                .registerTypeAdapter(BasketItem.class, new BasketItemSerializer())
                .disableHtmlEscaping()
                .setPrettyPrinting();
        Gson gson = gsonBuilder.create();
        return gson.toJsonTree(this);
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 17 * hash + Objects.hashCode(this.componentParentUUID);
        hash = 17 * hash + Objects.hashCode(this.title);
        hash = 17 * hash + Objects.hashCode(this.compType);
        hash = 17 * hash + Objects.hashCode(this.contentType);
        hash = 17 * hash + Objects.hashCode(this.type);
        hash = 17 * hash + Objects.hashCode(this.lang);
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
        final BasketItem other = (BasketItem) obj;
        if (!Objects.equals(this.componentParentUUID, other.componentParentUUID)) {
            return false;
        }
        if (!Objects.equals(this.title, other.title)) {
            return false;
        }
        if (!Objects.equals(this.compType, other.compType)) {
            return false;
        }
        if (!Objects.equals(this.contentType, other.contentType)) {
            return false;
        }
        if (this.type != other.type) {
            return false;
        }
        if (!Objects.equals(this.lang, other.lang)) {
            return false;
        }
        return true;
    }

    public static class Builder {

        private final String user_id;
        private final String component_parent_UUID;
        private final String title;
        private ObjectId basket_item_id;
        private Set<String> tags;
        private Set<BFilter> filters;
        private String component_type;
        private String content_type;
        private BasketType type;
        private Boolean isPrivate;//
        private String lang;

        public Builder(String userIDArg, String compParentUUIDArg, String titleArg) {
            this.user_id = userIDArg;
            this.component_parent_UUID = compParentUUIDArg;
            this.title = titleArg;
        }

        /**
         *
         * @param lang
         * @return
         */
        public Builder withLang(String lang) {
            this.lang = lang;
            return this;
        }

        /**
         *
         * @param tagsArg
         * @return
         */
        public Builder withTags(Set<String> tagsArg) {
            if (tagsArg == null) {
                this.tags = new LinkedHashSet(0);
            } else {
                this.tags = new LinkedHashSet(tagsArg);
            }
            return this;
        }

        /**
         *
         * @param filtersArg
         * @return
         */
        public Builder withFilters(Set<BFilter> filtersArg) {
            if (filtersArg == null) {
                this.filters = new LinkedHashSet(0);
            } else {
                this.filters = new LinkedHashSet(filtersArg);
            }
            return this;
        }

        /**
         *
         * @param compTarg
         * @return
         */
        public Builder withComponentType(String compTarg) {
            String compTargLower = compTarg.toLowerCase();
            if (!ComponentType.accepted.contains(compTargLower)) {
                throw new IllegalArgumentException(String.format("'%s' not accepted as a valid component type", compTarg));
            } else {
                this.component_type = compTargLower;
            }
            return this;
        }

        /**
         *
         * @param contTarg
         * @return
         */
        public Builder withContentType(String contTarg) {
            this.content_type = contTarg;
            return this;
        }

        /**
         *
         * @param id
         * @return
         */
        public Builder withID(ObjectId id) {
            this.basket_item_id = id;
            return this;
        }

        /**
         *
         * @param typeArg
         * @return
         */
        public Builder withType(BasketType typeArg) {
            this.type = typeArg;
            return this;
        }

        /**
         *
         * @param typeArg
         * @return
         */
        public Builder withType(String typeArg) throws IllegalArgumentException {
            if (typeArg.equalsIgnoreCase(BasketType.DATASET.getDecl())) {
                this.type = BasketType.DATASET;
            } else if (typeArg.equalsIgnoreCase(BasketType.VISUALIZATION.getDecl())) {
                this.type = BasketType.VISUALIZATION;
            } else {
                throw new IllegalArgumentException("type must be one of " + Arrays.asList(BasketType.values()).toString());
            }
            return this;
        }

        /**
         *
         * @param isPrivateArg
         * @return
         */
        public Builder withIsPrivate(boolean isPrivateArg) {
            this.isPrivate = isPrivateArg;
            return this;
        }

        public BasketItem build() {
            if (this.lang == null || this.lang.trim().isEmpty()) {
                this.lang = "en";
            }
            if (this.isPrivate == null) {
                this.isPrivate = Boolean.TRUE;
            }
            if (this.type == null) {
                throw new IllegalArgumentException("declare basket type");
            }
            if (this.content_type == null) {
                throw new IllegalArgumentException("declare content type");
            }
            if (this.component_type == null) {
                throw new IllegalArgumentException("declare component type");
            }
            return new BasketItem(this);
        }
    }

    /**
     * basket types: dataset/visualization, 'ALL' is used to override call
     */
    public enum BasketType {

        DATASET("dataset"), VISUALIZATION("visualization"), ALL("all");
        private final String type;

        private BasketType(String type) {
            this.type = type;
        }

        public String getDecl() {
            return type;
        }
    }

    /**
     * accepted component types.
     */
    public enum ComponentType {

        LINE("line"), PIE("pie"), BAR("bar"), MAP("map"), GRID("grid");
        private final String type;

        private ComponentType(String type) {
            this.type = type;
        }

        public String getDecl() {
            return type;
        }
        public static final Set<String> accepted = new HashSet();

        static {
            accepted.add(LINE.getDecl());
            accepted.add(PIE.getDecl());
            accepted.add(BAR.getDecl());
            accepted.add(MAP.getDecl());
            accepted.add(GRID.getDecl());
        }
    }

    public static final String FLD_USERID = "user_id";
    public static final String FLD_BASKET_ITEM_ID = "basket_item_id";
    public static final String FLD_OBJ_ID = "_id";
    public static final String FLD_COMPONENT_PARENT_UUID = "component_parent_uuid";
    public static final String FLD_TITLE = "title";
    public static final String FLD_TAGS = "tags";
    public static final String FLD_FILTERS = "filters";
    public static final String FLD_COMPONENT_TYPE = "component_type"; // accepted types: line, pie, bar, map, grid
    public static final String FLD_CONTENT_TYPE = "content_type";
    public static final String FLD_TYPE = "type";
    public static final String FLD_IS_PRIVATE = "is_private";
    public static final String FLD_LANG = "lang";

    /**
     * Helper class to serialize as needed in the API
     */
    class BasketItemSerializer implements JsonSerializer<BasketItem> {

        @Override
        public JsonElement serialize(BasketItem t, Type type, JsonSerializationContext jsc) {
            final JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty(BasketItem.FLD_USERID, t.getUserID());
            if (t.getBasketItemID() != null) {
                jsonObject.addProperty(BasketItem.FLD_BASKET_ITEM_ID, t.getBasketItemID().toString());
            }
            jsonObject.addProperty(BasketItem.FLD_COMPONENT_PARENT_UUID, t.getComponentParentUUID());
            jsonObject.addProperty(BasketItem.FLD_TITLE, t.getTitle());
            jsonObject.addProperty(BasketItem.FLD_COMPONENT_TYPE, t.getComponentType());
            jsonObject.addProperty(BasketItem.FLD_CONTENT_TYPE, t.getContentType());
            jsonObject.addProperty(BasketItem.FLD_TYPE, t.getType().getDecl());
            jsonObject.addProperty(BasketItem.FLD_IS_PRIVATE, t.isPrivate());
            jsonObject.addProperty(BasketItem.FLD_LANG, t.getLang());

            final JsonElement jsonTags = jsc.serialize(t.getTags());
            jsonObject.add(BasketItem.FLD_TAGS, jsonTags);

            // add filters
            final JsonArray jsonFilters = new JsonArray();
            for (final BFilter filt : t.getFilters()) {
                final JsonElement jsonfil = filt.toJSONElement();
                jsonFilters.add(jsonfil);
            }
            jsonObject.add(BasketItem.FLD_FILTERS, jsonFilters);
            return jsonObject;
        }
    }

    class BasketItemDeserializer implements JsonDeserializer<BasketItem> {

        @Override
        public BasketItem deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
            final JsonObject jsonObject = json.getAsJsonObject();
            // initial
            final String user_id = jsonObject.get(BasketItem.FLD_USERID).getAsString();
            final String component_parent_uuid = jsonObject.get(BasketItem.FLD_COMPONENT_PARENT_UUID).getAsString();
            final String title = jsonObject.get(BasketItem.FLD_TITLE).getAsString();
            // init builder object
            Builder b = new Builder(user_id, component_parent_uuid, title);
            // other
            JsonElement jsonbitemID = jsonObject.get(BasketItem.FLD_OBJ_ID);
            if (jsonbitemID != null) {
                ObjectId id = new ObjectId(jsonbitemID.getAsString());
                b = b.withID(id);
            }
            // tags
            final JsonArray jsonTags = jsonObject.get(BasketItem.FLD_TAGS).getAsJsonArray();
            final Set<String> sTags = new LinkedHashSet(jsonTags.size());
            for (int i = 0; i < jsonTags.size(); i++) {
                final JsonElement jsonTag = jsonTags.get(i);
                sTags.add(jsonTag.getAsString());
            }
            // add tags
            b = b.withTags(sTags);
            // filters
            final JsonArray jsonFilters = jsonObject.get(BasketItem.FLD_FILTERS).getAsJsonArray();
            final Set<BFilter> sFilters = new LinkedHashSet(jsonFilters.size());
            for (int i = 0; i < jsonFilters.size(); i++) {
                final JsonElement jsonFilt = jsonFilters.get(i);
                BFilter bf = new Gson().fromJson(jsonFilt, BFilter.class);
                sFilters.add(bf);
            }
            // add filters 
            b = b.withFilters(sFilters);
            // add rest items
            final String component_type = jsonObject.get(BasketItem.FLD_COMPONENT_TYPE).getAsString();
            final String content_type = jsonObject.get(BasketItem.FLD_CONTENT_TYPE).getAsString();
            final String type = jsonObject.get(BasketItem.FLD_TYPE).getAsString();
            final boolean isPrivate = jsonObject.get(BasketItem.FLD_IS_PRIVATE).getAsBoolean();
            final String lang = jsonObject.get(BasketItem.FLD_LANG).getAsString();

            b = b.withComponentType(component_type)
                    .withContentType(content_type)
                    .withType(type)
                    .withIsPrivate(isPrivate)
                    .withLang(lang);

            return b.build();
        }
    }
}
