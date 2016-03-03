package gr.demokritos.iit.ydsapi.model;

import java.util.List;
import java.util.Map;

/**
 *
 * @author George K. <gkiom@iit.demokritos.gr>
 */
public class ProjectInfo {

    List<Map<String, Object>> data;

    public ProjectInfo(List<Map<String, Object>> data) {
        this.data = data;
    }
   
    public List getData() {
        return data;
    }
    
//     String projectName;
    // "Ανάπλαση Νέας Παραλίας Θεσσαλονίκης - Τμήμα από το Βασιλικο Θέατρο έως τους Ομίλους Θαλασσίων Αθλημάτων Κωδικός 272150",
   
// "completion":"96.0%","budget":"22031920.00","decisions":"34","totalAmount":"14102155.04"}]}
    
}
