package gr.demokritos.iit.ydsapi.util;

import java.util.MissingResourceException;
import java.util.ResourceBundle;

/**
 *
 * @author George K.<gkiom@iit.demokritos.gr>
 */
public class ResourceUtil {

    protected final ResourceBundle properties;

    /**
     *
     * @param resBundlePath
     */
    public ResourceUtil(String resBundlePath) {
        this.properties = ResourceBundle.getBundle(resBundlePath);
    }

    /**
     *
     * @param key
     * @param def default value if key non existing
     * @return
     */
    public String getProperty(String key, String def) {
        String sRes;
        if (def != null) {
            try {
                sRes = (String) properties.getObject(key);
            } catch (MissingResourceException ex) {
                sRes = def;
            }
        } else {
            try {
                sRes = (String) properties.getObject(key);
            } catch (MissingResourceException ex) {
                sRes = null;
            }
        }
        return sRes == null ? def : sRes;
    }

    /**
     *
     * @param key
     * @return
     */
    public String getProperty(String key) {
        return getProperty(key, null);
    }
}
