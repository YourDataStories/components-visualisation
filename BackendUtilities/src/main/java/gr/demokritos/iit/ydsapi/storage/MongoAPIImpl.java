/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.storage;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.MongoCredential;
import com.mongodb.QueryBuilder;
import com.mongodb.ServerAddress;
import com.mongodb.WriteResult;
import com.mongodb.util.JSON;
import gr.demokritos.iit.ydsapi.model.BFilter;
import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.VizType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import gr.demokritos.iit.ydsapi.util.Configuration;
import gr.demokritos.iit.ydsapi.util.ResourceUtil;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.bson.types.ObjectId;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class MongoAPIImpl implements YDSAPI {

    private volatile static MongoAPIImpl instance;
    private DB db;

    public synchronized static YDSAPI getInstance() {
        if (instance == null) {
            instance = new MongoAPIImpl();
        }
        return instance;
    }

    private MongoAPIImpl() {
        ResourceUtil senti_res = new ResourceUtil("resources");
        Configuration conf = new Configuration();
        // get DB credentials
        String db_host = senti_res.getProperty(Configuration.DATABASE_HOST_DECLARATION, "localhost");
        String db_port = senti_res.getProperty(Configuration.DATABASE_PORT_DECLARATION, "27017");
        String db_name = senti_res.getProperty(Configuration.DATABASE_NAME_DECLARATION);
        String db_user_name = senti_res.getProperty(Configuration.DATABASE_USERNAME_DECLARATION);
        String db_pw = senti_res.getProperty(Configuration.DATABASE_PASSWORD_DECLARATION);
        conf.setProperty(Configuration.DATABASE_HOST_DECLARATION, db_host);
        conf.setProperty(Configuration.DATABASE_PORT_DECLARATION, db_port);
        conf.setProperty(Configuration.DATABASE_NAME_DECLARATION, db_name);
        conf.setProperty(Configuration.DATABASE_USERNAME_DECLARATION, db_user_name);
        conf.setProperty(Configuration.DATABASE_PASSWORD_DECLARATION, db_pw);
        try {
            ServerAddress sa = new ServerAddress(conf.getDatabaseHost(), conf.getDatabasePort());
            MongoCredential credential = MongoCredential.createCredential(conf.getDatabaseUserName(), conf.getDatabaseName(), conf.getDatabasePassword().toCharArray());
            MongoClient mongoClient = new MongoClient(sa, Arrays.asList(credential));
            db = mongoClient.getDB(conf.getDatabaseName());
            Logger.getAnonymousLogger().info(String.format("connection pool with database: '%s' initialized", conf.getDatabaseName()));
        } catch (UnknownHostException ex) {
            Logger.getLogger(MongoAPIImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public Object saveEmbedding(Object project_id, VizType type, Collection<YDSFacet> facets) {
        DBCollection col = db.getCollection(COL_EMBEDDINGS);
        Embedding emb = new Embedding(project_id, type, facets);
        String json_emb = emb.toJSON();
        int emb_hashcode = json_emb.hashCode();
        DBObject storable = (DBObject) JSON.parse(json_emb);
        storable.put(FLD_HASHCODE, emb_hashcode);
        WriteResult wr = col.update(
                QueryBuilder.start(FLD_HASHCODE).is(emb_hashcode).get(),
                storable,
                true,
                false
        );
        Object upserted_id = wr.getUpsertedId();
        String id;
        if (upserted_id == null) {
            id = (String) ((ObjectId) col.findOne(new BasicDBObject(FLD_HASHCODE, emb_hashcode)).get("_id")).toHexString();
        } else {
            id = upserted_id.toString();
        }
        return id;
    }

    @Override
    public Embedding getEmbedding(Object embedding_id) throws Exception {
        ObjectId id;
        DBObject dbo = null;
        Embedding emb = null;
        // search in DB for objectID provided
        DBCollection col = db.getCollection(COL_EMBEDDINGS);
        if (embedding_id instanceof ObjectId) {
            id = (ObjectId) embedding_id;
            // return JSON of object found 
        } else if (embedding_id instanceof String) {
            try {
                id = new ObjectId((String) embedding_id);
            } catch (Exception ex) {
                System.err.println(ex.getMessage());
                return null;
            }
        } else {
            return null;
        }
        DBCursor curs = col.find(QueryBuilder.start("_id").is(id).get());
        if (curs.hasNext()) {
            dbo = curs.next();
        }
        if (dbo != null) {
            emb = new Embedding();
            emb = emb.unpack(dbo);
        }
        return emb;
    }

    @Override
    public String saveBasketItem(BasketItem item) {
        DBCollection col = db.getCollection(COL_BASKETS);
        String jsonbi = item.toJSON();
        int emb_hashcode = item.hashCode();
        DBObject storable = (DBObject) JSON.parse(jsonbi);
        storable.put(FLD_HASHCODE, emb_hashcode);
        WriteResult wr = col.update(
                QueryBuilder.start(FLD_HASHCODE).is(emb_hashcode).get(),
                storable,
                true,
                false
        );
//        System.out.println(wr.toString());
        Object upserted_id = wr.getUpsertedId();
        String id;
        if (upserted_id == null) {
            id = (String) ((ObjectId) col.findOne(
                    new BasicDBObject(FLD_HASHCODE, emb_hashcode)).get("_id"))
                    .toHexString();
        } else {
            id = upserted_id.toString();
        }
        return id;
    }

    @Override
    public List<BasketItem> getBasketItems(String user_id) {
        if (user_id == null || user_id.trim().isEmpty()) {
            return Collections.EMPTY_LIST;
        }
        user_id = user_id.trim();
        DBCollection col = db.getCollection(COL_BASKETS);
        DBCursor curs;
        List<BasketItem> res = new ArrayList();
        if (USER_ID_PUBLIC.equalsIgnoreCase(user_id)) {
            curs = col.find(QueryBuilder.start(BasketItem.FLD_IS_PRIVATE).is(Boolean.FALSE).get());
        } else {
            curs = col.find(QueryBuilder.start(BasketItem.FLD_USERID).is(user_id).get());
        }
        while (curs.hasNext()) {
            DBObject dbo = curs.next();
            res.add(extractBasketItem(dbo));
        }
        return res;
    }

    @Override
    public BasketItem getBasketItem(ObjectId id) {
        BasketItem res = null;
        DBCollection col = db.getCollection(COL_BASKETS);

        DBCursor curs = col.find(QueryBuilder.start("_id").is(id).get());
        if (curs.hasNext()) {
            DBObject dbo = curs.next();
            res = extractBasketItem(dbo);
        }
        return res;
    }

    @Override
    public BasketItem getBasketItem(String id) {
        BasketItem res = null;
        ObjectId _id;
        try {
            _id = new ObjectId(id);
            res = getBasketItem(_id);
        } catch (Exception ex) {
            LOGGER.warning(String.format("%s", ex.getMessage()));
        }
        return res;
    }

    @Override
    public boolean removeBasketItem(String user_id, String basket_item_id) {
        boolean res = false;
        if (basket_item_id == null || basket_item_id.trim().isEmpty()) {
            return res;
        }
        basket_item_id = basket_item_id.trim();
        DBCollection col = db.getCollection(COL_BASKETS);
        ObjectId _id;
        try {
            _id = new ObjectId(basket_item_id);
            WriteResult wr = col.remove(QueryBuilder.start(BasketItem.FLD_USERID).is(user_id).and(BasketItem.FLD_OBJ_ID).is(_id).get());
            res = wr.getN() > 0;
        } catch (Exception ex) {
            LOGGER.warning(String.format("%s", ex.getMessage()));
        }
        return res;
    }

    @Override
    public int removeBasketItems(String user_id) {
        int removed = 0;
        if (user_id == null || user_id.trim().isEmpty()) {
            return removed;
        }
        user_id = user_id.trim();
        DBCollection col = db.getCollection(COL_BASKETS);
        try {
            WriteResult wr = col.remove(QueryBuilder.start(BasketItem.FLD_USERID).is(user_id).get());
            removed = wr.getN();
        } catch (Exception ex) {
            LOGGER.warning(String.format("%s", ex.getMessage()));
        }
        return removed;
    }

    private BasketItem extractBasketItem(DBObject dbo) {
        ObjectId _id;
        try {
            _id = (ObjectId) dbo.get(BasketItem.FLD_OBJ_ID);
        } catch (ClassCastException ex) {
            String id = (String) dbo.get(BasketItem.FLD_OBJ_ID);
            _id = new ObjectId(id);
        }
        String user_id = (String) dbo.get(BasketItem.FLD_USERID);
        String component_parent_uuid = (String) dbo.get(BasketItem.FLD_COMPONENT_PARENT_UUID);
        String title = (String) dbo.get(BasketItem.FLD_TITLE);

        String component_type = (String) dbo.get(BasketItem.FLD_COMPONENT_TYPE);
        String type = (String) dbo.get(BasketItem.FLD_TYPE);
        String content_type = (String) dbo.get(BasketItem.FLD_CONTENT_TYPE);
        boolean is_private = (Boolean) dbo.get(BasketItem.FLD_IS_PRIVATE);
        String lang = (String) dbo.get(BasketItem.FLD_LANG);
        List<String> tags = (List<String>) dbo.get(BasketItem.FLD_TAGS);
        List<BFilter> filters = extractFilters((List<DBObject>) dbo.get(BasketItem.FLD_FILTERS));
        return new BasketItem.Builder(user_id, component_parent_uuid, title)
                .withID(_id)
                .withTags(new HashSet(tags))
                .withFilters(new HashSet(filters))
                .withComponentType(component_type)
                .withContentType(content_type)
                .withType(type)
                .withIsPrivate(is_private)
                .withLang(lang)
                .build();
    }

    private List<BFilter> extractFilters(List<DBObject> dbos) {
        List<BFilter> filters = new ArrayList();
        for (DBObject dbo : dbos) {
            filters.add(extractFilter(dbo));
        }
        return filters;
    }

    private BFilter extractFilter(DBObject dbo) {
        String applied_to = (String) dbo.get(BFilter.FLD_APPLIED_TO);
        Map<String, Object> attrs = (Map<String, Object>) dbo.get(BFilter.FLD_ATTRIBUTES);
        return new BFilter(applied_to, attrs);
    }
}
