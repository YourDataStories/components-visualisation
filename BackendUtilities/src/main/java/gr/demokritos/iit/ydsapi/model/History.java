/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gr.demokritos.iit.ydsapi.model;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Panagiotis Giotis <giotis.p@gmail.com>
 */
public class History {
    
    private List<HistoryVersion> history = new ArrayList<HistoryVersion>();

    public History() {
    }

    public void addVersion(HistoryVersion version) {
        this.history.add(version);
    }
    
    public List<HistoryVersion> getHistory() {
        return history;
    }

    public void setHistory(List<HistoryVersion> history) {
        this.history = history;
    }

    @Override
    public String toString() {
        return "History{" + "history:" + history + '}';
    }
    
}
