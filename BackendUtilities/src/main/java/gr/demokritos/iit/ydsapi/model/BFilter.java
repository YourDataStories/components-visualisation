package gr.demokritos.iit.ydsapi.model;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import java.util.Map;
import java.util.Objects;

/**
 *
 * @author George K. <gkiom@scify.org>
 */
public class BFilter {

    private final String applied_to;
    private final Map<String, Object> attrs;

    public BFilter(String applied_to, Map<String, Object> attrs) {
        this.applied_to = applied_to;
        this.attrs = attrs;
    }

    public String getApplied_to() {
        return applied_to;
    }

    public Map<String, Object> getAttrs() {
        return attrs;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 23 * hash + Objects.hashCode(this.applied_to);
        hash = 23 * hash + Objects.hashCode(this.attrs);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final BFilter other = (BFilter) obj;
        if (!Objects.equals(this.applied_to, other.applied_to)) {
            return false;
        }
        if (!Objects.equals(this.attrs, other.attrs)) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "BFilter{" + "applied_to=" + applied_to + ", attrs=" + attrs.toString() + "}";
    }

    public JsonElement toJSONElement() {
        return new Gson().toJsonTree(this, BFilter.class);
    }
    
    public static final String FLD_APPLIED_TO = "applied_to";
    public static final String FLD_ATTRIBUTES = "attrs";
}
