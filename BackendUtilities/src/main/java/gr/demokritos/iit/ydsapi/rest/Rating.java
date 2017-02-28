package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.model.ChartRating;
import gr.demokritos.iit.ydsapi.responses.RatingListLoadResponse;
import gr.demokritos.iit.ydsapi.responses.RatingSaveResponse;
import gr.demokritos.iit.ydsapi.storage.MongoAPIImpl;
import gr.demokritos.iit.ydsapi.storage.YDSAPI;
import gr.demokritos.iit.ydsapi.responses.BaseResponse.Status;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("yds/rating/")
@Produces(MediaType.APPLICATION_JSON)
public class Rating {

    @Path("save")
    @POST
    public Response save(
            @FormParam("chart_type") String chartType,
            @FormParam("project_id") String projectId,
            @FormParam("view_type") String viewType,
            @FormParam("lang") String lang,
            @FormParam("extra_params") String extraParams,
            @FormParam("page_url") String pageUrl,
            @FormParam("user_id") String userId,
            @FormParam("rating") Integer rating
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        RatingSaveResponse res = new RatingSaveResponse();

        try {
            ChartRating cr = new ChartRating(
                    rating,
                    chartType,
                    lang,
                    pageUrl,
                    projectId,
                    viewType,
                    userId,
                    extraParams
            );

            String hash = api.saveRating(cr);
            if (hash != null && !hash.trim().isEmpty()) {
                res.setGenerated_hash(hash);
                res.setStatus(Status.OK);
            } else {
                res.setStatus(Status.ERROR);
                res.setMessage("Error when storing rating...");
            }
        } catch (Exception ex) {
            System.err.println(ex.toString());
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
            @PathParam("user_id") String user_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        List<ChartRating> ratings;
        RatingListLoadResponse rlr;

        try {
            ratings = api.getRatings(user_id);
            rlr = new RatingListLoadResponse(ratings);
        } catch (Exception ex) {
            rlr = new RatingListLoadResponse(null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString()
            );
        }
        return Response.status(
                rlr.getStatus() == Status.OK || rlr.getStatus() == Status.NOT_EXISTS
                        ? Response.Status.OK
                        : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(rlr.toJSON()).build();
    }
}
