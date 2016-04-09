package gr.demokritos.iit.ydsapi.model;

import java.util.HashSet;
import java.util.Set;

/**
 * accepted component types.
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public enum ComponentType {

    LINE("line"), PIE("pie"), BAR("bar"), MAP("map"), GRID("grid"), RESULT("result");
    private final String type;

    private ComponentType(String type) {
        this.type = type;
    }

    public String getDecl() {
        return type;
    }
    public static final Set<String> accepted = new HashSet();

    static {
        accepted.add(LINE.getDecl());
        accepted.add(PIE.getDecl());
        accepted.add(BAR.getDecl());
        accepted.add(MAP.getDecl());
        accepted.add(GRID.getDecl());
        accepted.add(RESULT.getDecl());
    }
}
