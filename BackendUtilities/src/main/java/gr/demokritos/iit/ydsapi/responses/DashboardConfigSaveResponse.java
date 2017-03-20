package gr.demokritos.iit.ydsapi.responses;

import com.google.gson.GsonBuilder;

public class DashboardConfigSaveResponse extends BaseResponse implements IResponse {
    private Object dashboard_config_id;

    public DashboardConfigSaveResponse(Status status, String message) {
        super(status, message);
    }

    public DashboardConfigSaveResponse() {
        super();
    }

    public Object getDashboard_config_id() {
        return dashboard_config_id;
    }

    public void setDashboard_config_id(Object dashboard_config_id) {
        this.dashboard_config_id = dashboard_config_id;
    }

    @Override
    public String toJSON() {
        return new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create().toJson(this, DashboardConfigSaveResponse.class);
    }
}
