package gr.demokritos.iit.ydsapi.storage;

import gr.demokritos.iit.ydsapi.model.*;
import gr.demokritos.iit.ydsapi.model.BasketItem.BasketType;
import org.bson.types.ObjectId;

import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;

/**
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public interface YDSAPI {

    final Logger LOGGER = Logger.getLogger(YDSAPI.class.getName());

    static String COL_EMBEDDINGS = "embeddings";
    static String COL_BASKETS = "baskets";
    static String COL_RATINGS = "ratings";
    static String COL_DASHBOARDCONFIGS = "dashboardconfigs";
    static String FLD_HASHCODE = "hashcode";
    static String USER_ID_PUBLIC = "public";

    Embedding getEmbedding(Object embedding_id) throws Exception;

    Object saveEmbedding(Object project_id, ComponentType type, Collection<YDSFacet> facets, Object view_type, Object lang);

    /**
     * @param item
     * @return the basket_item_id
     */
    String saveBasketItem(BasketItem item);

    BasketItem getBasketItem(ObjectId id);

    /**
     * @param id
     * @return
     */
    BasketItem getBasketItem(String id);

    BasketItem getBasketItem(
            String user_id,
            String basket_item_id
    );


    /**
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
     * @param user_id
     * @param basket_item_id
     * @return true if item was removed successfully
     */
    boolean removeBasketItem(String user_id, String basket_item_id);

    /**
     * @param user_id
     * @return number of items removed
     */
    int removeBasketItems(String user_id);

    /**
     * Get the ratings that a user has made
     *
     * @param user_id ID of user
     * @return Chart ratings
     */
    List getRatings(String user_id);

    /**
     * Save a rating to the database
     *
     * @param rating Rating to be saved
     * @return Hashcode of newly saved rating
     */
    String saveRating(ChartRating rating);

    /**
     * Get the saved Dashboard configurations of a user.
     *
     * @param user_id
     * @return
     */
    List getDashboardConfigurations(String user_id);

    /**
     * Save a Dashboard configuration
     *
     * @param config
     * @return
     */
    String saveDashboardConfiguration(DashboardConfig config);
}
