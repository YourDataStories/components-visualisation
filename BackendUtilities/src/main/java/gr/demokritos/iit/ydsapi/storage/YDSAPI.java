package gr.demokritos.iit.ydsapi.storage;

import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.BasketItem.BasketType;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.ComponentType;
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
    static String USER_ID_PUBLIC = "public";

    Embedding getEmbedding(Object embedding_id) throws Exception;

    Object saveEmbedding(Object project_id, ComponentType type, Collection<YDSFacet> facets);

    /**
     *
     * @param item
     * @return the basket_item_id
     */
    String saveBasketItem(BasketItem item);

    BasketItem getBasketItem(ObjectId id);

    /**
     *
     * @param id
     * @return
     */
    BasketItem getBasketItem(String id);

    BasketItem getBasketItem(
                    String user_id,
                    String basket_item_id
            );


    /**
     * 
     * @param user_id
     * @param component_parent_uuid
     * @param component_type
     * @param content_type
     * @param type
     * @param lang
     * @return the item that corresponds to the supplied params. If not exists, return null
     */
    BasketItem getBasketItem(
            String user_id, 
            String component_parent_uuid, 
            String component_type, 
            String content_type, 
            String type, 
            String lang
    );

    /**
     * get basket items, by basket type
     *
     * @param user_id
     * @param type
     * @return
     */
    List<BasketItem> getBasketItems(String user_id, BasketType type);

    /**
     *
     * @param user_id
     * @param basket_item_id
     * @return true if item was removed successfully
     */
    boolean removeBasketItem(String user_id, String basket_item_id);

    /**
     *
     * @param user_id
     * @return number of items removed
     */
    int removeBasketItems(String user_id);

}
