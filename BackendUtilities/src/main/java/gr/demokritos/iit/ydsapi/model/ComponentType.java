package gr.demokritos.iit.ydsapi.model;

import java.util.HashSet;
import java.util.Set;

/**
 * accepted component types.
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public enum ComponentType {

    LINE("line"), SCATTER("scatter"), PIE("pie"), BAR("bar"), MAP("map"), GRID("grid"), RESULT("result"), RESULTSET("resultset");
    private final String type;

    private ComponentType(String type) {
        this.type = type;
    }

    public String getDecl() {
        return type;
    }
    public static final Set<String> ACCEPTED = new HashSet();

    static {
        ACCEPTED.add(LINE.getDecl());
        ACCEPTED.add(SCATTER.getDecl());
        ACCEPTED.add(PIE.getDecl());
        ACCEPTED.add(BAR.getDecl());
        ACCEPTED.add(MAP.getDecl());
        ACCEPTED.add(GRID.getDecl());
        ACCEPTED.add(RESULT.getDecl());
        ACCEPTED.add(RESULTSET.getDecl());
    }
}
