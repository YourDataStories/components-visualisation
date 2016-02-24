/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.storage;

import gr.demokritos.iit.ydsapi.model.Embedding;
import gr.demokritos.iit.ydsapi.model.VizType;
import gr.demokritos.iit.ydsapi.model.YDSFacet;
import java.util.Collection;
import java.util.logging.Logger;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public interface YDSAPI {

    final Logger LOGGER = Logger.getLogger(YDSAPI.class.getName());
    
    static String COL_EMBEDDINGS = "embeddings";

    Embedding getEmbedding(Object embedding_id) throws Exception;

    Object saveEmbedding(Object project_id, VizType type, Collection<YDSFacet> facets);

}
