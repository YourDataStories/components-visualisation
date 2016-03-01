/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.couch;

import static gr.demokritos.iit.ydsapi.storage.YDSAPI.LOGGER;
import gr.demokritos.iit.ydsapi.util.ResourceUtil;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriBuilder;
import javax.ws.rs.core.UriBuilderException;
import org.jboss.resteasy.client.ClientRequest;
import org.jboss.resteasy.client.ClientRequestFactory;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class CouchCallerImpl implements CouchCaller {

    private volatile static CouchCallerImpl instance;
    private String couch_base_url;

    public synchronized static CouchCaller getInstance() {
        if (instance == null) {
            instance = new CouchCallerImpl();
        }
        return instance;
    }

    private CouchCallerImpl() {
        ResourceUtil resources = new ResourceUtil("resources");
        couch_base_url = resources.getProperty("couch_url", "http://localhost:5984/");
        LOGGER.info(String.format("registered as base Couch URL: %s", couch_base_url));
    }

    @Override
    public Response callCouchGet(String db_name, String project_key_value, String id) throws Exception {
        ClientRequest req
                = executeGet(db_name, project_key_value, id);
        return req.get(String.class);
    }

    @Override
    public Response callCouchGet(String db_name, String project_key_value, String id, Class class_of_response_entity) throws Exception {
        ClientRequest req
                = executeGet(db_name, project_key_value, id);
        return req.get(class_of_response_entity);
    }

    private ClientRequest executeGet(String db_name, String project_key_value, String id) throws UriBuilderException, IllegalArgumentException {
        String url
                = couch_base_url.endsWith("/")
                ? couch_base_url
                : couch_base_url.concat("/");
        String parameters_request = (db_name == null ? "espa_projects" : db_name).concat("/")
                .concat(project_key_value == null ? "project" : project_key_value).concat("=")
                .concat(id);
//        System.out.println(url);
        LOGGER.info(String.format("calling: %s", url.concat(parameters_request)));
        ClientRequestFactory crf = new ClientRequestFactory(UriBuilder.fromUri(couch_base_url).build());
        ClientRequest req = crf.createRelativeRequest(parameters_request);
        return req;
    }
}
