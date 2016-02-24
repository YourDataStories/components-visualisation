/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.couch;

import javax.ws.rs.core.Response;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public interface CouchCaller {

    /**
     *
     * @param db_name the db to interact, if null, 'espa_projects' is used
     * @param project_key_value the table name, else 'project'
     * @param id the ID of the project required
     * @return the entity received from the couch API
     * @throws Exception
     */
    Response callCouchGet(String db_name, String project_key_value, String id) throws Exception;

    /**
     *
     * @param db_name the db to interact, if null, 'espa_projects' is used
     * @param project_key_value the table name, else 'project'
     * @param id the ID of the project required
     * @param class_of_entity the entity class, if other than string
     * @return the entity received from the couch API
     * @throws Exception
     */
    Response callCouchGet(String db_name, String project_key_value, String id, Class class_of_entity) throws Exception;
}
