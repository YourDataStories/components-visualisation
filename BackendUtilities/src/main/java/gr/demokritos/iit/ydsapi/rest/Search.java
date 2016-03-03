package gr.demokritos.iit.ydsapi.rest;

import gr.demokritos.iit.ydsapi.model.YDSQuery;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.commons.io.FileUtils;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
@Path("yds/api/")
@Produces(MediaType.APPLICATION_JSON)
public class Search {

    @Path("search")
    @POST
    public String search(
            @FormParam("search_obj") String search_obj
    ) {

        YDSQuery q = new YDSQuery().unpack(search_obj);
        return q.getTerms().get(0).getFacets().isEmpty() ? read_response(true) : read_response(false);
    }

    private String read_response(boolean full) {
        String path = "";
        if (full) {

            URL url = getClass().getResource("/");
            path = url.getPath() + "response_full.json";
        } else {
            URL url = getClass().getResource("/");
            path = url.getPath() + "response_small.json";
        }
        try {
            return FileUtils.readFileToString(new File(path));
        } catch (IOException ex) {
            Logger.getLogger(Search.class.getName()).log(Level.SEVERE, null, ex);
            return "ERROR: " + ex.getMessage();
        }
    }
}
