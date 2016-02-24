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
public class YDSTerm {

    private String term;

    private List<YDSFacet> facets;

    public YDSTerm() {
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public List<YDSFacet> getFacets() {
        return facets;
    }

    public void setFacets(List<YDSFacet> facets) {
        this.facets = facets;
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 37 * hash + (this.term != null ? this.term.hashCode() : 0);
        hash = 37 * hash + (this.facets != null ? this.facets.hashCode() : 0);
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
        final YDSTerm other = (YDSTerm) obj;
        if ((this.term == null) ? (other.term != null) : !this.term.equals(other.term)) {
            return false;
        }
        if (this.facets != other.facets && (this.facets == null || !this.facets.equals(other.facets))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "YDSTerm{" + "term=" + term + ", facets=" + facets + '}';
    }

}
