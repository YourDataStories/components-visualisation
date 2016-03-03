package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class YDSQuery {
    
    private boolean advanced;
    private List<YDSTerm> terms;

    public YDSQuery() {
    }

    public boolean isAdvanced() {
        return advanced;
    }

    public void setAdvanced(boolean advanced) {
        this.advanced = advanced;
    }

    public List<YDSTerm> getTerms() {
        return terms;
    }

    public void setTerms(List<YDSTerm> terms) {
        this.terms = terms;
    }

    @Override
    public String toString() {
        return "YDSQuery{" + "advanced=" + advanced + ", terms=" + terms + '}';
    }

    public YDSQuery unpack(String json) {
        return new Gson().fromJson(json, this.getClass());
    }
    
}
