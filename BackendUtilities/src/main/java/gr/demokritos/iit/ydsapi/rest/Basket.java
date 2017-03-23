package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.model.*;
import gr.demokritos.iit.ydsapi.model.BasketItem.BasketType;
import gr.demokritos.iit.ydsapi.responses.*;
import gr.demokritos.iit.ydsapi.responses.BaseResponse.Status;
import gr.demokritos.iit.ydsapi.retrieve.BasketDatatestRetrieve;
import gr.demokritos.iit.ydsapi.storage.MongoAPIImpl;
import gr.demokritos.iit.ydsapi.storage.YDSAPI;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
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

    @Path("save_dashboard")
    @POST
    public Response saveDashboardConfig(
            String json_dashboard_config
    ) {
        DashboardConfigSaveResponse res = new DashboardConfigSaveResponse();
        YDSAPI api = MongoAPIImpl.getInstance();

        try {
            DashboardConfig item = new DashboardConfig(json_dashboard_config);
            String id = api.saveDashboardConfiguration(item);
            if (id != null && !id.isEmpty()) {
                res.setStatus(BaseResponse.Status.OK);
                res.setDashboard_config_id(id);
            } else {
                res.setStatus(Status.OK);
                res.setMessage("Could not save dashboard configuration");
                res.setDashboard_config_id("");
            }
        } catch (Exception ex) {
            System.out.println(ex.toString());
            res.setStatus(Status.ERROR);
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
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("basket_type: %s", basket_type));

        if (basket_type.equals("dashboard")) {
            // Type Dashboard has a different type of items which aren't visualisations or datasets
            List<DashboardConfig> items;
            DashboardConfigListLoadResponse dclr;
            try {
                items = api.getDashboardConfigurations(user_id);
                LOG.info(String.format("baskets size: %d", items.size()));
                dclr = new DashboardConfigListLoadResponse(items);
            } catch (Exception ex) {
                dclr = new DashboardConfigListLoadResponse(
                        Status.ERROR,
                        ex.getMessage() != null ? ex.getMessage() : ex.toString(),
                        null
                );
            }

            return Response.status(
                    dclr.getStatus() == Status.OK || dclr.getStatus() == Status.NOT_EXISTS
                            ? Response.Status.OK
                            : Response.Status.INTERNAL_SERVER_ERROR
            ).entity(dclr.toJSON()).build();
        } else {
            List<BasketItem> baskets;
            BasketListLoadResponse blr;
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
    }

    @Path("getUserCharts")
    @GET
    public Response getUserCharts(
            @QueryParam("user_id") String user_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        UserChartsLoadResponse uclr;
        List<UserChart> userCharts = new ArrayList<>();

        try {
            // Get basket visualizations
            List<BasketItem> basketItems = api.getBasketItems(user_id, BasketType.VISUALISATION);

            // For each visualization, get an embed code
            for (BasketItem item : basketItems) {
                // Create empty array for possible facets of basket item
                ArrayList<YDSFacet> facets = new ArrayList<>();

                // If there are any filters for the visualization, add them as facets
                if (!item.getFilters().isEmpty()) {
                    for (BFilter filter : item.getFilters()) {
                        YDSFacet newFacet = new YDSFacet();                 // Create new facet

                        ArrayList<String> filterValues = new ArrayList<>(); // Create array for facet values

                        filterValues.add(filter.getAttrs().toString());     // Add filter attrs as a facet value

                        newFacet.setFacet_values(filterValues);             // Set array with filter attrs as the facet's values

                        facets.add(newFacet);                               // Add this facet to the facets array
                    }
                }

                // Get embed code
                Object embeddingId = api.saveEmbedding(
                        item.getComponentParentUUID(),
                        ComponentType.valueOf(item.getComponentType().toUpperCase()),
                        facets,
                        item.getContentType(),
                        item.getLang());

                // Create user chart item and add it to list
                userCharts.add(new UserChart(
                        item.getBasketItemID().toString(),
                        item.getComponentParentUUID(),
                        item.getTitle(),
                        "",             // description
                        "",             // thumbnail url
                        embeddingId,
                        item.getComponentType()));
            }

            uclr = new UserChartsLoadResponse(userCharts);
        } catch (Exception ex) {
            uclr = new UserChartsLoadResponse(
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }

        return Response.status(
                uclr.getStatus() == Status.OK || uclr.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(uclr.toJSON()).build();
    }

    @Path("retrieve/{user_id}/{basket_item_id}")
    @GET
    public Response retrieve(
            @PathParam("user_id") String user_id,
            @PathParam("basket_item_id") String basket_item_id
    ) {
        ResponseBuilder r = Response.noContent();
        Response res;
        YDSAPI api = MongoAPIImpl.getInstance();
        BasketItem item;
        String dataset = null;
        BasketDatatestRetrieve bdr = new BasketDatatestRetrieve();
        LOG.info(String.format("user_id: %s", user_id));
        LOG.info(String.format("basket_item_id: %s", basket_item_id));
        Object[] re;
        RetrieveLoadResponse rlr = null;
        // signify when we want to return the DB item or delegate the call to 
        // the other API
        boolean returnItem = false;
        try {
            item = api.getBasketItem(
                    user_id,
                    basket_item_id
            );
            switch (ComponentType.valueOf(item.getComponentType().toUpperCase())) {
                case PIE:
                    dataset = bdr.getPieDataset(item.getComponentParentUUID(),
                            item.getContentType(), item.getLang());
                    break;
                case MAP:
                    dataset = bdr.getMapDataset(item.getComponentParentUUID(),
                            item.getContentType(), item.getLang());
                    break;
                case LINE:
                    dataset = bdr.getLineDataset(item.getComponentParentUUID(),
                            item.getContentType(), item.getLang(), item.getFilters());
                    break;
                case GRID:
                    dataset = bdr.getGridDataset(item.getComponentParentUUID(),
                            item.getContentType(), item.getLang(), item.getFilters());
                    break;
                // on result / resultset, we return the item from the repository.
                // we wrap the basket item in the retrieveloadresponse class 
                // to mimic the 'dataset' format
                case RESULT:
                    returnItem = true;
                    rlr = new RetrieveLoadResponse(true, Status.OK.toString().toLowerCase(), item);
                    break;
                case RESULTSET:
                    returnItem = true;
                    re = new Object[]{item.toJSON()};
                    rlr = new RetrieveLoadResponse(true, Status.OK.toString().toLowerCase(), item);
                    break;
            }
            res = r.status(Response.Status.OK).entity(returnItem ? rlr.toJSON() : dataset).build();
        } catch (Exception ex) {
            rlr = new RetrieveLoadResponse(
                    false,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
            res = r.status(Response.Status.INTERNAL_SERVER_ERROR).entity(rlr.toJSON()).build();
        }
        return res;
    }

    @Path("get_item/{basket_item_id}")
    @GET
    public Response getItem(
            @PathParam("basket_item_id") String basket_item_id
    ) {
        ResponseBuilder r = Response.noContent();
        Response res;
        YDSAPI api = MongoAPIImpl.getInstance();
        final BasketItem bskt;
        RetrieveLoadResponse rlr;
        LOG.info(String.format("basket_item_id: %s", basket_item_id));
        try {
            bskt = api.getBasketItem(basket_item_id);
            rlr = new RetrieveLoadResponse(
                    true,
                    bskt == null ? Status.NOT_EXISTS.toString().toLowerCase() : Status.OK.toString().toLowerCase(),
                    bskt);
            res = r.status(Response.Status.OK).entity(rlr.toJSON()).build();
        } catch (Exception ex) {
            rlr = new RetrieveLoadResponse(
                    false,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
            res = r.status(Response.Status.INTERNAL_SERVER_ERROR).entity(rlr.toJSON()).build();
        }
        return res;
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

    @Path("removeDashboards/{user_id}")
    @POST
    public Response removeFilters(
            @PathParam("user_id") String user_id,
            @FormParam("basket_item_id") String basket_item_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        BaseResponse br;
        try {
            if (basket_item_id == null) {
                int res = api.removeDashboardConfigurations(user_id);
                br = new BaseResponse(Status.OK, getMessage(res, user_id));
                LOG.info(String.format("delete items: %d", res));
            } else {
                boolean res = api.removeDashboardConfiguration(user_id, basket_item_id);
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
