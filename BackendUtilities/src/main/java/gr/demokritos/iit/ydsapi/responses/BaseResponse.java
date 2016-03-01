/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class BaseResponse implements IResponse {

    public enum Status {

        OK, ERROR, NOT_EXISTS
    }
    private Status status;
    private String message;

    /**
     * construct a response with a status and a message
     *
     * @param status
     * @param message
     */
    public BaseResponse(Status status, String message) {
        this.status = status;
        this.message = message;
    }

    /**
     * empty message response
     *
     * @param status
     */
    public BaseResponse(Status status) {
        this.status = status;
    }

    /**
     * default OK response
     */
    public BaseResponse() {
        this.status = Status.OK;
        this.message = "";
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Status getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return "BaseResponse{" + "status=" + status + ", message=" + message + '}';
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, BaseResponse.class);
    }

    @Override
    public JsonElement toJSONElement() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJsonTree(this, BaseResponse.class);
    }
}
