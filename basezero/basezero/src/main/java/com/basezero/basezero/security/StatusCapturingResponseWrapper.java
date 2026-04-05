package com.basezero.basezero.security;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

public class StatusCapturingResponseWrapper extends HttpServletResponseWrapper {

    private int status = 200;

    public StatusCapturingResponseWrapper(HttpServletResponse response) {
        super(response);
    }

    @Override
    public void setStatus(int sc) {
        this.status = sc;
        super.setStatus(sc);
    }

    @Override
    public void sendError(int sc) throws java.io.IOException {
        this.status = sc;
        super.sendError(sc);
    }

    public int getStatus() { return status; }
}