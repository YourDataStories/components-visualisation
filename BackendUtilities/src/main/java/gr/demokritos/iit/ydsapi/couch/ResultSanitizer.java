/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.couch;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class ResultSanitizer {

    static String INPUT_DATE_FORMAT = "dd/MM/yyyy";
    static String OUTPUT_DATE_FORMAT = "yyyy-MM-dd";

    // TODO: add these fields for specific implementations
    private boolean cast_int;
    private boolean cast_float;
    private boolean alter_date;

    ESPAFieldParser efp;
    private Gson gson;

    public ResultSanitizer() {
//        this.cast_int = cast_int;
//        this.alter_date = alter_date;
        this.gson = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create();
        this.efp = new ESPAFieldParser();
    }

    /**
     * CAUTION: not a generic implementation, currently works only for
     * List<Map<String, Object>> JSON representations. TODO add generic parsing
     *
     * @param incoming must be a JSON string reflecting the token_type structure
     * @param token_type the structure that the JSON represents
     * @return
     */
    public String sanitize(String incoming, TypeToken token_type) {

        Object fromJson = gson.fromJson(incoming, token_type.getType());

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        if (fromJson instanceof List) {
            List lj = (List) fromJson;
            for (Object each : lj) {
                if (each instanceof Map) {
                    Map<Object, Object> items = (Map) each;
                    Map<String, Object> tmp = new LinkedHashMap();
                    for (Map.Entry entrySet : items.entrySet()) {
                        Object key = entrySet.getKey();
                        Object value = entrySet.getValue();

                        tmp.put((String) key, efp.parse((String) value));
                    }
                    result.add(tmp);
                }
            }
        }
//        System.out.println(result.toString());
        return gson.toJson(result, token_type.getType());
    }

    /**
     * CAUTION: not a generic implementation, currently works only for
     * List<Map<String, Object>> JSON representations. TODO add generic parsing
     *
     * @param incoming
     * @return
     */
    public List<Map<String, Object>> sanitize(List<Map<String, Object>> incoming) {

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> each : incoming) {
            Map<String, Object> tmp = new LinkedHashMap();
            for (Map.Entry entrySet : each.entrySet()) {
                Object key = entrySet.getKey();
                Object value = entrySet.getValue();

                tmp.put((String) key, efp.parse((String) value));
            }
            result.add(tmp);
        }
//        System.out.println(result.toString());
        return result;
    }

    public String alterDateFormat(String date_format_input, String date_format_output, String input_date) {
        String strDate = input_date;
        try {
            SimpleDateFormat sdfSource = new SimpleDateFormat(date_format_input);
            Date date = sdfSource.parse(input_date);
            SimpleDateFormat sdfDestination = new SimpleDateFormat(OUTPUT_DATE_FORMAT);

            strDate = sdfDestination.format(date);

//            System.out.println(String.format("Date is converted from %s format to %s", date_format_input, date_format_output));
//            System.out.println("Converted date is : " + strDate);
        } catch (ParseException pe) {
            System.out.println("Parse Exception : " + pe);
        }
        return strDate;
    }

}
