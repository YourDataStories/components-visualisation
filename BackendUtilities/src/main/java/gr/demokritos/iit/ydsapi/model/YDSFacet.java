/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.model;

import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class YDSFacet {
    
    private String facet_type;
    private List<String> facet_values;

    public YDSFacet() {
    }

    public String getFacet_type() {
        return facet_type;
    }

    public void setFacet_type(String facet_type) {
        this.facet_type = facet_type;
    }

    public List<String> getFacet_values() {
        return facet_values;
    }

    public void setFacet_values(List<String> facet_values) {
        this.facet_values = facet_values;
    }

    @Override
    public int hashCode() {
        int hash = 5;
        hash = 17 * hash + (this.facet_type != null ? this.facet_type.hashCode() : 0);
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
        final YDSFacet other = (YDSFacet) obj;
        if ((this.facet_type == null) ? (other.facet_type != null) : !this.facet_type.equals(other.facet_type)) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "YDSFacet{" + "facet_type=" + facet_type + ", facet_values=" + facet_values + '}';
    }
    
    
    
}
