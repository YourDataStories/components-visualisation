package gr.demokritos.iit.ydsapi.rest;

import com.google.gson.Gson;
import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.ComponentType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import gr.demokritos.iit.ydsapi.responses.BaseResponse;
import gr.demokritos.iit.ydsapi.responses.BaseResponse.Status;
import gr.demokritos.iit.ydsapi.responses.EmbedLoadResponse;
import gr.demokritos.iit.ydsapi.responses.EmbedSaveResponse;
import gr.demokritos.iit.ydsapi.storage.MongoAPIImpl;
import gr.demokritos.iit.ydsapi.storage.YDSAPI;
import java.util.Collection;
import java.util.List;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
@Path("yds/embed/")
@Produces(MediaType.APPLICATION_JSON)
public class Embed {

    @Path("save")
    @POST
    public Response search(
            @FormParam("project_id") String project_id,
            @FormParam("facets") String facets,
            @FormParam("viz_type") String viz_type
    ) {
        EmbedSaveResponse res = new EmbedSaveResponse();
        YDSAPI api = MongoAPIImpl.getInstance();
        try {
            ComponentType t = ComponentType.valueOf(viz_type.toUpperCase());
            Collection<YDSFacet> ydsfacets = new Gson().fromJson(facets, List.class);
            if (ydsfacets != null) {
                Object generated_hash = api.saveEmbedding(project_id, t, ydsfacets);
                res.setGenerated_hash(generated_hash);
                res.setStatus(BaseResponse.Status.OK);
            } else {
                res.setStatus(Status.ERROR);
                res.setMessage("Please provide facets to store");
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

    @Path("{embed_id}")
    @GET
    public Response load(
            @PathParam("embed_id") String embed_id
    ) {
        YDSAPI api = MongoAPIImpl.getInstance();
        Embedding el;
        EmbedLoadResponse elr;
        try {
            el = api.getEmbedding(embed_id);
            elr = new EmbedLoadResponse(el);
        } catch (Exception ex) {
            elr = new EmbedLoadResponse(
                    null,
                    null,
                    null,
                    Status.ERROR,
                    ex.getMessage() != null ? ex.getMessage() : ex.toString());
        }
        return Response.status(
                elr.getStatus() == Status.OK
                        ? Response.Status.OK
                        : elr.getStatus() == Status.NOT_EXISTS
                                ? Response.Status.NOT_FOUND
                                : Response.Status.INTERNAL_SERVER_ERROR
        ).entity(elr.toJSON()).build();
    }
}
