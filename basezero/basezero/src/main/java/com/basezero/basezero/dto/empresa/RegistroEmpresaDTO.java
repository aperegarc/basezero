package com.basezero.basezero.dto.empresa;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegistroEmpresaDTO {

    @NotBlank
    private String nombreEmpresa;

    @NotBlank @Email
    private String emailEmpresa;

    @NotBlank
    private String nombreAdmin;

    @NotBlank @Email
    private String emailAdmin;

    @NotBlank
    private String passwordAdmin;

    public String getNombreEmpresa() { return nombreEmpresa; }
    public void setNombreEmpresa(String nombreEmpresa) { this.nombreEmpresa = nombreEmpresa; }
    public String getEmailEmpresa() { return emailEmpresa; }
    public void setEmailEmpresa(String emailEmpresa) { this.emailEmpresa = emailEmpresa; }
    public String getNombreAdmin() { return nombreAdmin; }
    public void setNombreAdmin(String nombreAdmin) { this.nombreAdmin = nombreAdmin; }
    public String getEmailAdmin() { return emailAdmin; }
    public void setEmailAdmin(String emailAdmin) { this.emailAdmin = emailAdmin; }
    public String getPasswordAdmin() { return passwordAdmin; }
    public void setPasswordAdmin(String passwordAdmin) { this.passwordAdmin = passwordAdmin; }
}