package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.JsonElement;

/**
 * a response to send through the API
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public interface IResponse {

    String toJSON();
    
    JsonElement toJSONElement();

}
