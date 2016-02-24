package gr.demokritos.iit.ydsapi.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

/**
 * Contains all program specific parameters.
 *
 * @author George K. <gkiom@scify.org>
 */
public class Configuration {

    public static String ENCODING_UTF_8 = "utf-8";

    private final Properties properties;
    public static final String FILE_SEPARATOR = System.getProperty("file.separator");
    public static final String UNDERSCORE = "_";

    public static String DATABASE_HOST_DECLARATION = "database_host";
    public static String DATABASE_PORT_DECLARATION = "database_port";
    public static String DATABASE_NAME_DECLARATION = "database_name";
    public static String DATABASE_USERNAME_DECLARATION = "database_username";
    public static String DATABASE_PASSWORD_DECLARATION = "database_password";

    public Configuration() {
        this.properties = new Properties();
    }

    public Configuration(String configurationFileName) {
        File file = new File(configurationFileName);
        this.properties = new Properties();
        try {
            this.properties.load(new FileInputStream(file));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public String getDatabaseHost() {
        return properties.getProperty(DATABASE_HOST_DECLARATION, "localhost");
    }

    public int getDatabasePort() {
        return Integer.parseInt(properties.getProperty(DATABASE_PORT_DECLARATION, "27018"));
    }

    public String getDatabaseName() {
        return properties.getProperty(DATABASE_NAME_DECLARATION, "dbName");
    }

    public String getDatabaseUserName() {
        return properties.getProperty(DATABASE_USERNAME_DECLARATION, "dbUserName");
    }

    public String getDatabasePassword() {
        return properties.getProperty(DATABASE_PASSWORD_DECLARATION);
    }

    /**
     * Manually sets 'working dir'
     *
     * @param sWorkingDir the path to set
     * @see {@link #getWorkingDir() }
     */
    public void setWorkingDir(String sWorkingDir) {
        properties.put("workingDir", sWorkingDir);
    }

    /**
     *
     * @return the directory where all files are stored and read from
     */
    public String getWorkingDir() {
        String sWorkingDir = properties.getProperty("workingDir");
        if (!sWorkingDir.endsWith(FILE_SEPARATOR)) {
            return sWorkingDir + FILE_SEPARATOR;
        } else {
            return sWorkingDir;
        }
    }

    public void setProperty(String key, String value) {
        properties.put(key, value);
    }

    @Override
    public String toString() {
        return "Configuration{" + "properties=" + properties.toString() + "}";
    }
}
