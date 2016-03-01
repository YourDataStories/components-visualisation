/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.couch;

import com.github.drapostolos.typeparser.TypeParser;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class ESPAFieldParser {

    static String INPUT_DATE_FORMAT = "dd/MM/yyyy";
    static String OUTPUT_DATE_FORMAT = "yyyy-MM-dd";
    TypeParser parser = TypeParser.newBuilder().build();

    public Object parse(String string) {
        if (string.matches("[0-9]+")) {
            return parser.parse(string, Integer.class);
        } else if (string.matches("[0-9]+[.,][0-9]+")) {
            return parser.parse(string, Float.class);
        } else if (string.matches("[0-9]{2}[/-][0-9]{2}[/-][0-9]{4}")) {
            return alterDateFormat(INPUT_DATE_FORMAT, OUTPUT_DATE_FORMAT, string);
        }
        return string;
    }

    public Object parse(String string, boolean parse_integer, boolean parse_float, boolean alter_date) {
        if (parse_integer && parse_float && alter_date) {
            return parse(string);
        }
        if (parse_integer) {
            if (string.matches("[0-9]+")) {
                return parser.parse(string, Integer.class);
            }
        }
        if (parse_float) {
            if (string.matches("[0-9]+[.,][0-9]+")) {
                return parser.parse(string, Float.class);
            }
        }
        if (alter_date) {
            if (string.matches("[0-9]{2}[/-][0-9]{2}[/-][0-9]{4}")) {
                return alterDateFormat(INPUT_DATE_FORMAT, OUTPUT_DATE_FORMAT, string);
            }
        }
        return string;
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
