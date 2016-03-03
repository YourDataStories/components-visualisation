package gr.demokritos.iit.ydsapi.model;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class HistoryVersion {
   
    private String project_id;
    private String version_id;

    public HistoryVersion() {
    }

    public HistoryVersion(String project_id, String version_id) {
        this.project_id = project_id;
        this.version_id = version_id;
    }

    public String getProject_id() {
        return project_id;
    }

    public void setProject_id(String project_id) {
        this.project_id = project_id;
    }

    public String getVersion_id() {
        return version_id;
    }

    public void setVersion_id(String version_id) {
        this.version_id = version_id;
    }

    @Override
    public String toString() {
        return "HistoryVersion{" + "project_id=" + project_id + ", version_id=" + version_id + '}';
    }

   
    
}
