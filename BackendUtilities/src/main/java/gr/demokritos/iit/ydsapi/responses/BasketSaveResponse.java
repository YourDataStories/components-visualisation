package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class BasketSaveResponse extends BaseResponse implements IResponse {

    private String basket_item_id;

    public BasketSaveResponse(Status status, String message) {
        super(status, message);
    }

    public BasketSaveResponse() {
        super();
    }

    public String getID() {
        return basket_item_id;
    }

    public void setID(String id) {
        this.basket_item_id = id;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, BasketSaveResponse.class);
    }
}
