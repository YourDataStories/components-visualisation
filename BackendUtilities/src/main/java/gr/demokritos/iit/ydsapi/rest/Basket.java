package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.model.BasketItem;
import gr.demokritos.iit.ydsapi.model.BasketItem.BasketType;
import gr.demokritos.iit.ydsapi.responses.BaseResponse;
import gr.demokritos.iit.ydsapi.responses.BaseResponse.Status;
import gr.demokritos.iit.ydsapi.responses.BasketItemLoadResponse;
import gr.demokritos.iit.ydsapi.responses.BasketListLoadResponse;
import gr.demokritos.iit.ydsapi.responses.BasketSaveResponse;
import gr.demokritos.iit.ydsapi.retrieve.BasketDatatestRetrieve;
import gr.demokritos.iit.ydsapi.storage.MongoAPIImpl;
import gr.demokritos.iit.ydsapi.storage.YDSAPI;
import java.util.List;
import java.util.logging.Logger;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
@Path("yds/basket/")
@Produces(MediaType.APPLICATION_JSON)
public class Basket {

    private static final Logger LOG = Logger.getLogger(Basket.class.getName());

    @Path("save")
    @POST
    public Response save(
            String json_basket_item
    ) {
        BasketSaveResponse res = new BasketSaveResponse();
        YDSAPI api = MongoAPIImpl.getInstance();
        try {
            BasketItem item = new BasketItem(json_basket_item);
            String id = api.saveBasketItem(item);
            if (id != null && !id.isEmpty()) {
                res.setStatus(BaseResponse.Status.OK);
                res.setID(id);
            } else {
                res.setStatus(Status.OK);
                res.setMessage("Could not save basket item");
                res.setID("");
            }
        } catch (Exception ex) {
            System.out.println(ex.toString()); // error response
            res.setStatus(BaseResponse.Status.ERROR);
            res.setMessage(ex.getMessage() != null
                    ? ex.getMessage()
                    : ex.toString());
        }
        return Response.status(
                res.getStatus() == Status.OK
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR)
                .entity(res.toJSON()).build();
    }

    @Path("get/{user_id}")
    @GET
    public Response load(
            @PathParam("user_id") String user_id,
            @QueryParam("basket_type") String basket_type
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        List<BasketItem> baskets;
        BasketListLoadResponse blr;
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("basket_type: %s", basket_type));
        try {
            baskets = api.getBasketItems(
                    user_id,
                    basket_type == null
                            ? BasketType.ALL
                            : BasketType.valueOf(basket_type.toUpperCase())
            );
            LOG.info(String.format("baskets size: %d", baskets.size()));
            blr = new BasketListLoadResponse(baskets);
        } catch (Exception ex) {
            blr = new BasketListLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                blr.getStatus() == Status.OK || blr.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(blr.toJSON()).build();
    }

    @Path("retrieve/{user_id}/{basket_item_id}")
    @GET
    public Response retrieve(
            @PathParam("user_id") String user_id,
            @PathParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        BasketItem item;
        BasketItemLoadResponse bi;
        String dataset = null;
        BasketDatatestRetrieve bdr = new BasketDatatestRetrieve();
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("basket_item_id: %s", basket_item_id));
        try {
            item = api.getBasketItem(
                    user_id,
                    basket_item_id
            );

            switch (item.getComponentType().toLowerCase()) {
                case "pie":
                    dataset = bdr.getPieDataset(item.getComponentParentUUID(), 
                            item.getContentType(), item.getLang());
                    break;
                case "map":
                    dataset = bdr.getMapDataset(item.getComponentParentUUID(), 
                            item.getContentType(), item.getLang());
                    break;
                case "line":
                    dataset = bdr.getLineDataset(item.getComponentParentUUID(), 
                            item.getContentType(), item.getLang(), item.getFilters());
                    break;
                case "grid":
                    dataset = bdr.getGridDataset(item.getComponentParentUUID(), 
                            item.getContentType(), item.getLang(), item.getFilters());
                    break;
                case "result":
                    dataset = bdr.getSearchDataset(item.getComponentParentUUID(), 
                            item.getContentType(), item.getLang(), item.getFilters());
                    break;
            }

//            bi = new BasketItemLoadResponse(item);
//
        } catch (Exception ex) {
            bi = new BasketItemLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
//        return Response.status(
//                bi.getStatus() == Status.OK || bi.getStatus() == Status.NOT_EXISTS
//                        ? Response.Status.OK
//                        : Response.Status.INTERNAL_SERVER_ERROR
//        ).entity(bi.toJSON()).build();
        return Response.status(
                Response.Status.OK
        ).entity(dataset).build();
    }

    @Path("get_item/{basket_item_id}")
    @GET
    public Response getItem(
            @PathParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        final BasketItem bskt;
        BasketItemLoadResponse blr;
        LOG.info(String.format("basket_item_id: %s", basket_item_id));
        try {
            bskt = api.getBasketItem(basket_item_id);
            blr = new BasketItemLoadResponse(bskt);
        } catch (Exception ex) {
            blr = new BasketItemLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                blr.getStatus() == Status.OK || blr.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(blr.toJSON()).build();
    }

    @Path("remove/{user_id}")
    @POST
    public Response remove(
            @PathParam("user_id") String user_id,
            @FormParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        BaseResponse br;
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("basket_item_id: %s", basket_item_id));
        try {
            if (basket_item_id == null) {
                int res = api.removeBasketItems(user_id);
                br = new BaseResponse(Status.OK, getMessage(res, user_id));
                LOG.info(String.format("delete items: %d", res));
            } else {
                boolean res = api.removeBasketItem(user_id, basket_item_id);
                br = new BaseResponse(Status.OK, getMessage(res, basket_item_id));
                LOG.info(String.format("delete item: %s", Boolean.toString(res)));
            }
        } catch (Exception ex) {
            br = new BaseResponse(
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                br.getStatus() == Status.OK || br.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(br.toJSON()).build();
    }

    @Path("exists_item")
    @GET
    public Response existsItem(
            @QueryParam("user_id") String user_id,
            @QueryParam("component_parent_uuid") String component_parent_uuid,
            @QueryParam("component_type") String component_type,
            @QueryParam("content_type") String content_type,
            @QueryParam("type") String type,
            @QueryParam("lang") String lang
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        final BasketItem bskt;
        BasketItemLoadResponse blr;
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("user_id: %s", component_parent_uuid));
        try {
            bskt = api.getBasketItem(user_id, component_parent_uuid, component_type, content_type, type, lang);
            blr = new BasketItemLoadResponse(bskt);
        } catch (Exception ex) {
            blr = new BasketItemLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                blr.getStatus() == Status.OK || blr.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(blr.toJSON()).build();
    }

    private static String getMessage(boolean res, String basket_item_id) {
        return res ? String.format("id: '%s' removed succesfully", basket_item_id) : String.format("id: '%s' not found", basket_item_id);
    }

    private static String getMessage(int res, String user_id) {
        return res > 0
                ? res > 1 ? String.format("removed succesfully %d items", res) : String.format("removed succesfully %d item", res)
                : String.format("no basket items found for user '%s'", user_id);
    }
}
