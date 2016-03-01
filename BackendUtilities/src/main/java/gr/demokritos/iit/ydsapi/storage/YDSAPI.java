/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.storage;

import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.VizType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;
import org.bson.types.ObjectId;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public interface YDSAPI {

    final Logger LOGGER = Logger.getLogger(YDSAPI.class.getName());

    static String COL_EMBEDDINGS = "embeddings";
    static String COL_BASKETS = "baskets";
    static String FLD_HASHCODE = "hashcode";

    Embedding getEmbedding(Object embedding_id) throws Exception;

    Object saveEmbedding(Object project_id, VizType type, Collection<YDSFacet> facets);

    /**
     * 
     * @param item
     * @return the basket_item_id
     */
    String saveBasketItem(BasketItem item);

    BasketItem getBasketItem(ObjectId id);

    List<BasketItem> getBasketItems(String user_id);

}
