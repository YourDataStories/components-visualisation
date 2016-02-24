/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.couch;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;
import java.rmi.ServerException;
import java.util.Map;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class ESPAParser {

    private final String espa_json;
    private final String project_id;

    public static final String FIELD_ID = "_id";

    private static final String RESPONSE_ERROR_KEY = "error";
    private static final String RESPONSE_ERROR_VALUE = "not_found";
    private static final String RESPONSE_REASON_KEY = "reason";
    private static final String RESPONSE_REASON_VALUE = "missing";

    public ESPAParser(String espa_json, String project_id) {
        this.espa_json = espa_json;
        this.project_id = project_id;
    }

    public Object getContent(String espa_table_type) throws TableTypeNotFoundException, IDNotFoundException, ServerException {
        Type plain_map_type = new TypeToken<Map<String, Object>>() {
        }.getType();
        Map<String, Object> test = new Gson().fromJson(espa_json, plain_map_type);
        if (test.containsKey(RESPONSE_ERROR_KEY)) {
            if (test.get(RESPONSE_ERROR_KEY).equals(RESPONSE_ERROR_VALUE)) {
                if (test.containsKey(RESPONSE_REASON_KEY)) {
                    if (test.get(RESPONSE_REASON_KEY).equals(RESPONSE_REASON_VALUE)) {
                        throw new IDNotFoundException();
                    }
                }
            } else {
                throw new ServerException((String) test.get(RESPONSE_ERROR_KEY));
            }
        }
        for (Map.Entry<String, Object> entrySet : test.entrySet()) {
            String key = entrySet.getKey();
            if (key.equals(FIELD_ID)) {
                String id = (String) entrySet.getValue();
                if (id.contains("=")) {
                    id = id.split("=")[1];
                }
                if (!id.equals(project_id)) {
                    throw new IDNotFoundException();
                }
            }
            if (key.equals(espa_table_type.trim())) {
                return entrySet.getValue();
            }
        }
        throw new TableTypeNotFoundException();
    }

    /**
     * Exception that points out the table was not existing
     */
    public class TableTypeNotFoundException extends Exception {

        private static final String message = "Table type provided not present in dataset";

        public TableTypeNotFoundException() {
            super(message);
        }

        public TableTypeNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Exception that points out the table was not existing
     */
    public class IDNotFoundException extends Exception {

        private static final String message = "ID not present in the dataset";

        public IDNotFoundException() {
            super(message);
        }

        public IDNotFoundException(String message) {
            super(message);
        }
    }
}
