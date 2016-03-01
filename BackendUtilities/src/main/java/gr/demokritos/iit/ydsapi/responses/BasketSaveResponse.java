/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class BasketSaveResponse extends BaseResponse implements IResponse {

    private String id;

    public BasketSaveResponse(Status status, String message) {
        super(status, message);
    }

    public BasketSaveResponse() {
        super();
    }

    public String getID() {
        return id;
    }

    public void setID(String id) {
        this.id = id;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, BasketSaveResponse.class);
    }
}
