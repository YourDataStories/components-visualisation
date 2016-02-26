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
import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.VizType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import gr.demokritos.iit.ydsapi.util.Configuration;
import gr.demokritos.iit.ydsapi.util.ResourceUtil;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
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
            id = (String) ((ObjectId) col.findOne(new BasicDBObject("hashcode", emb_hashcode)).get("_id")).toHexString();
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
    public void saveBasketItem(BasketItem item) {
        // TODO: test
        DBCollection col = db.getCollection(COL_BASKETS);
        String jsonbi = item.toJSON();
        int emb_hashcode = item.hashCode();
        DBObject storable = (DBObject) JSON.parse(jsonbi);
        storable.put(FLD_HASHCODE, emb_hashcode);
        col.update(
                QueryBuilder.start(FLD_HASHCODE).is(emb_hashcode).get(),
                storable,
                true,
                false
        );
    }

    @Override
    public List<BasketItem> getBasketItems(String user_id) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public BasketItem getBasketItem(ObjectId id) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}

//filters : [{filter1, filter2…, n}]
//
//[
//{ 
//    applied_to: ‘quick_bar’
//    attrs : {
//        ‘ΔΕΗ’ : true
//              }
//},
//{ 
//    applied_to: budget
//    attrs: {
//        ‘gte’ : 50
//             }
//}, 
//{ 
//    applied_to: subProjectTitle
//    attrs: {
//        ‘OKΩ DEH’ : true,
//        ‘other’ : true
//             }
//}
//]
//
//
//
//Line
//
//attribute_name : {
//    min: 123213131,
//    max: 131312313
//}
//
//[
//{ 
//    applied_to: ‘attribute_name’
//    attrs : {
//        ‘axis : ‘y’ or ‘x’,
//        ‘min’ : 313213123,
//        ‘max’ : 313311233
//}
//}
//]
