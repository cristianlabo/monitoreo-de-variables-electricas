import React, { useState } from "react"
import type { NextPage } from "next"
import { useRouter } from "next/router"

import {
  useConfiguracionAlarmasList,
  createConfiguracionAlarma,
  updateConfiguracionAlarma,
  deleteConfiguracionAlarma,
  useDispositivoList
} from "../../api"

import {
  useUsersList,
  createUser,
  updateUser,
  deleteUser
} from "../../api"

import {
  Layout
} from "../../Components"

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertColor,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material"

import SettingsIcon
from "@mui/icons-material/Settings"

import ExpandMoreIcon
from "@mui/icons-material/ExpandMore"

import NotificationsActiveIcon
from "@mui/icons-material/NotificationsActive"

import PersonIcon
from "@mui/icons-material/Person"

import AddIcon
from "@mui/icons-material/Add"

import EditIcon
from "@mui/icons-material/Edit"

import DeleteIcon
from "@mui/icons-material/Delete"

import GitHubIcon
from "@mui/icons-material/GitHub"

import LinkedInIcon
from "@mui/icons-material/LinkedIn"

import InstagramIcon
from "@mui/icons-material/Instagram"

const Configuracion: NextPage = () => {

  const router =
    useRouter();

  const { role } =
    router.query;

  const {
    configuracionAlarmas,
    mutateConfiguracionAlarmas
  } =
    useConfiguracionAlarmasList();

  const {
    dispositivos
  } =
    useDispositivoList();

  const {
    usuarios,
    mutateUsers
  } =
    useUsersList();

  const [
    openModalAlarma,
    setOpenModalAlarma
  ] =
    useState(false);

  const [
    openModalUsuario,
    setOpenModalUsuario
  ] =
    useState(false);

  const [
    modoModalAlarma,
    setModoModalAlarma
  ] =
    useState("NUEVA");

  const [
    formAlarma,
    setFormAlarma
  ] =
    useState({
      configuracionAlarmaId: "",
      dispositivoId: "",
      nombre: "",
      ubicacion: "",
      tipoAlarma: "CONSUMO_EXCEDIDO",
      habilitada: true,
      consumoLimite: 0,
      unidad: "kWh",
      periodo: "MENSUAL",
      prioridad: "MEDIA",
      mensaje: ""
    });

  const [
    alarmaEditando,
    setAlarmaEditando
  ] =
    useState<any>(null);

  const [
    modoModalUsuario,
    setModoModalUsuario
  ] =
    useState("NUEVO");

  const [
    formUsuario,
    setFormUsuario
  ] =
    useState({
      username: "",
      password: "",
      email: "",
      role: "USER",
      enabled: true
    });

  const [
    usuarioEditando,
    setUsuarioEditando
  ] =
    useState<any>(null);

  const [
    usuarioAEliminar,
    setUsuarioAEliminar
  ] =
    useState<any>(null);

  const [
    alarmaAEliminar,
    setAlarmaAEliminar
  ] =
    useState<any>(null);

  const [
    openConfirmEliminar,
    setOpenConfirmEliminar
  ] =
    useState(false);

  const [
    openConfirmEliminarAlarma,
    setOpenConfirmEliminarAlarma
  ] =
    useState(false);

  const [
    snackbarOpen,
    setSnackbarOpen
  ] =
    useState(false);

  const [
    snackbarMessage,
    setSnackbarMessage
  ] =
    useState("");

  const [
    snackbarSeverity,
    setSnackbarSeverity
  ] =
    useState<AlertColor>("success");

  const [
    cargando,
    setCargando
  ] =
    useState(false);

  const onBack =
    () => {

      if (role) {

        router.push(
          `/home?role=${role}`
        );

      } else {

        router.push(
          "/home"
        );

      }

    }

  const limpiarFormUsuario = () => {
    setFormUsuario({
      username: "",
      password: "",
      email: "",
      role: "USER",
      enabled: true
    });
    setUsuarioEditando(null);
  };

  const limpiarFormAlarma = () => {
    setFormAlarma({
      configuracionAlarmaId: "",
      dispositivoId: "",
      nombre: "",
      ubicacion: "",
      tipoAlarma: "CONSUMO_EXCEDIDO",
      habilitada: true,
      consumoLimite: 0,
      unidad: "kWh",
      periodo: "MENSUAL",
      prioridad: "MEDIA",
      mensaje: ""
    });
    setAlarmaEditando(null);
  };

  const abrirModalNuevoUsuario = () => {
    limpiarFormUsuario();
    setModoModalUsuario("NUEVO");
    setOpenModalUsuario(true);
  };

  const abrirModalNuevaAlarma = () => {
    limpiarFormAlarma();
    setModoModalAlarma("NUEVA");
    setOpenModalAlarma(true);
  };

  const obtenerIdAlarmaApi = (alarma: any) => {
    if (!alarma) {
      return null;
    }

    return alarma.configuracionAlarmaId ?? alarma.alarmaId ?? alarma._id ?? null;
  };

  const abrirModalEditarAlarma = (alarma: any) => {
    setFormAlarma({
      configuracionAlarmaId: alarma.configuracionAlarmaId ?? alarma.alarmaId ?? "",
      dispositivoId: alarma.dispositivoId ?? "",
      nombre: alarma.nombre ?? "",
      ubicacion: alarma.ubicacion ?? "",
      tipoAlarma: alarma.tipoAlarma ?? "CONSUMO_EXCEDIDO",
      habilitada: alarma.habilitada ?? true,
      consumoLimite: alarma.consumoLimite ?? 0,
      unidad: alarma.unidad ?? "kWh",
      periodo: alarma.periodo ?? "MENSUAL",
      prioridad: alarma.prioridad ?? "MEDIA",
      mensaje: alarma.mensaje ?? ""
    });
    setAlarmaEditando(alarma);
    setModoModalAlarma("EDITAR");
    setOpenModalAlarma(true);
  };

  const abrirModalEditarUsuario = (usuario: any) => {
    const esAdmin = usuario.role === "ADMIN";

    setFormUsuario({
      username: usuario.username,
      password: "",
      email: usuario.email,
      role: esAdmin ? "ADMIN" : usuario.role,
      enabled: esAdmin ? true : usuario.enabled
    });
    setUsuarioEditando(usuario);
    setModoModalUsuario("EDITAR");
    setOpenModalUsuario(true);
  };

  const esAdminEditando =
    modoModalUsuario === "EDITAR" &&
    usuarioEditando?.role === "ADMIN";

  const mostrarSnackbar = (message: string, severity: AlertColor = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const cerrarSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const guardarUsuario = async () => {
    try {
      if (modoModalUsuario === "NUEVO") {
        if (!formUsuario.username || !formUsuario.password || !formUsuario.email) {
          mostrarSnackbar("Por favor completa todos los campos requeridos (Usuario, Contraseña, Email)", "error");
          return;
        }
      } else if (modoModalUsuario === "EDITAR" && usuarioEditando) {
        if (!formUsuario.email) {
          mostrarSnackbar("Por favor completa el email", "error");
          return;
        }
      }

      setCargando(true);
      
      if (modoModalUsuario === "NUEVO") {
        await createUser(formUsuario);
      } else if (modoModalUsuario === "EDITAR" && usuarioEditando) {
        const dataActualizar = {
          email: formUsuario.email,
          role: formUsuario.role,
          enabled: formUsuario.enabled
        };
        if (esAdminEditando) {
          dataActualizar.role = "ADMIN";
          dataActualizar.enabled = true;
        }
        if (formUsuario.password) {
          Object.assign(dataActualizar, { password: formUsuario.password });
        }
        await updateUser(usuarioEditando.username, dataActualizar);
      }
      
      await mutateUsers();
      setOpenModalUsuario(false);
      limpiarFormUsuario();
      mostrarSnackbar("Usuario guardado exitosamente", "success");
    } catch (error: any) {
      console.error("Error al guardar usuario:", error);
      const mensaje = error?.response?.data?.message || error?.message || "Error al guardar usuario";
      mostrarSnackbar(`Error: ${mensaje}`, "error");
    } finally {
      setCargando(false);
    }
  };

  const abrirConfirmEliminarUsuario = (usuario: any) => {
    setUsuarioAEliminar(usuario);
    setOpenConfirmEliminar(true);
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) {
      return;
    }

    try {
      setCargando(true);
      await deleteUser(usuarioAEliminar.username);
      await mutateUsers();
      setOpenConfirmEliminar(false);
      setUsuarioAEliminar(null);
      mostrarSnackbar("Usuario eliminado exitosamente", "success");
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      const mensaje = error?.response?.data?.message || error?.message || "Error al eliminar usuario";
      mostrarSnackbar(`Error: ${mensaje}`, "error");
    } finally {
      setCargando(false);
    }
  };

  const cancelarEliminarUsuario = () => {
    setOpenConfirmEliminar(false);
    setUsuarioAEliminar(null);
  };

  const guardarAlarma = async () => {
    try {
      if ((modoModalAlarma === "EDITAR" && !formAlarma.configuracionAlarmaId) || !formAlarma.dispositivoId || !formAlarma.nombre || !formAlarma.ubicacion || !formAlarma.tipoAlarma || !formAlarma.unidad || !formAlarma.periodo || !formAlarma.prioridad) {
        mostrarSnackbar("Por favor completa todos los campos obligatorios de la alarma", "error");
        return;
      }

      setCargando(true);
      const payload: any = {
        dispositivoId: Number(formAlarma.dispositivoId),
        nombre: formAlarma.nombre,
        ubicacion: formAlarma.ubicacion,
        tipoAlarma: formAlarma.tipoAlarma,
        habilitada: formAlarma.habilitada,
        mensaje: formAlarma.mensaje,
        prioridad: formAlarma.prioridad,
        consumoLimite: Number(formAlarma.consumoLimite),
        unidad: formAlarma.unidad,
        periodo: formAlarma.periodo
      };

      if (modoModalAlarma === "EDITAR" && alarmaEditando) {
        const apiId = obtenerIdAlarmaApi(alarmaEditando) ?? Number(formAlarma.configuracionAlarmaId);
        if (apiId === null || apiId === undefined || Number.isNaN(Number(apiId))) {
          mostrarSnackbar("ID de configuración inválido. No se puede actualizar.", "error");
          return;
        }
        payload.configuracionAlarmaId = Number(obtenerIdAlarmaApi(alarmaEditando));
        await updateConfiguracionAlarma(Number(apiId), payload);
      } else {
        await createConfiguracionAlarma(payload);
      }

      await mutateConfiguracionAlarmas();
      setOpenModalAlarma(false);
      limpiarFormAlarma();
      mostrarSnackbar("Configuración de alarma guardada exitosamente", "success");
    } catch (error: any) {
      console.error("Error al guardar configuración de alarma:", error);
      const mensaje = error?.response?.data?.message || error?.message || "Error al guardar la configuración";
      mostrarSnackbar(`Error: ${mensaje}`, "error");
    } finally {
      setCargando(false);
    }
  };

  const confirmarEliminarAlarma = async () => {
    if (!alarmaAEliminar) {
      return;
    }

    try {
      setCargando(true);
      const apiId = obtenerIdAlarmaApi(alarmaAEliminar);
      if (apiId === null || apiId === undefined || Number.isNaN(Number(apiId))) {
        mostrarSnackbar("ID de configuración inválido. No se puede eliminar.", "error");
        return;
      }
      await deleteConfiguracionAlarma(Number(apiId));
      await mutateConfiguracionAlarmas();
      setOpenConfirmEliminarAlarma(false);
      setAlarmaAEliminar(null);
      mostrarSnackbar("Configuración de alarma eliminada exitosamente", "success");
    } catch (error: any) {
      console.error("Error al eliminar configuración de alarma:", error);
      const mensaje = error?.response?.data?.message || error?.message || "Error al eliminar la configuración";
      mostrarSnackbar(`Error: ${mensaje}`, "error");
    } finally {
      setCargando(false);
    }
  };

  const cancelarEliminarAlarma = () => {
    setOpenConfirmEliminarAlarma(false);
    setAlarmaAEliminar(null);
  };

  return (

    <Layout>

      {/* HEADER */}
      <Paper
        elevation={4}
        sx={{
          background:
            "#263238",
          color:
            "white",
          padding:
            "25px",
          marginBottom:
            "25px",
          borderRadius:
            "12px",
          textAlign:
            "center"
        }}
      >

        <SettingsIcon
          sx={{
            fontSize:
              55,
            color:
              "#90CAF9"
          }}
        />

        <Typography
          variant="h4"
          fontWeight="bold"
        >
          CONFIGURACIÓN
        </Typography>

        <Typography
          variant="body2"
        >
          Administración de
          alarmas y usuarios
          del sistema IoT
        </Typography>

      </Paper>


      {/* BOTON VOLVER */}
      <div
        style={{
          marginBottom:
            "20px"
        }}
      >

        <Button
          variant="contained"
          onClick={onBack}
          sx={{
            backgroundColor:
              "#455A64",

            '&:hover': {
              backgroundColor:
                "#37474F"
            }
          }}
        >
          VOLVER
        </Button>

      </div>


      {/* CONFIGURACION ALARMAS */}
      <Accordion
        defaultExpanded
        sx={{
          marginBottom:
            "20px",
          borderRadius:
            "12px !important",
          overflow:
            "hidden"
        }}
      >

        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon />
          }
          sx={{
            backgroundColor:
              "#37474F",
            color:
              "white"
          }}
        >

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "10px"
            }}
          >

            <NotificationsActiveIcon />

            <Typography
              fontWeight="bold"
            >
              CONFIGURACIÓN
              DE ALARMAS
            </Typography>

          </div>

        </AccordionSummary>

        <AccordionDetails>

          {/* BOTON NUEVA CONFIGURACION */}
          <div
            style={{
              marginBottom:
                "20px"
            }}
          >

            <Button
              variant="contained"
              startIcon={
                <AddIcon />
              }
              onClick={abrirModalNuevaAlarma}
              sx={{
                backgroundColor:
                  "#2E7D32",

                '&:hover': {
                  backgroundColor:
                    "#1B5E20"
                }
              }}
            >
              CONFIGURACIÓN
              DE ALARMA
            </Button>

          </div>


          {/* TABLA ALARMAS */}
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              borderRadius:
                "15px",
              overflow:
                "hidden"
            }}
          >

            <Table>

              <TableHead>

                <TableRow
                  sx={{
                    backgroundColor:
                      "#37474F"
                  }}
                >

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ID
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    DISPOSITIVO
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    UBICACIÓN
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    TIPO
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ESTADO
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    CONFIGURACIÓN
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    PRIORIDAD
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ACCIÓN
                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {configuracionAlarmas?.map(
                  (
                    element: any
                  ) => (

                    <TableRow
                      key={
                        element.configuracionAlarmaId ?? element.alarmaId
                      }
                      hover
                      sx={{
                        transition:
                          "0.2s",

                        '&:hover': {
                          backgroundColor:
                            "#ECEFF1"
                        }
                      }}
                    >

                      <TableCell>
                        {
                          element.configuracionAlarmaId ?? element.alarmaId
                        }
                      </TableCell>

                      <TableCell>
                        {
                          element.nombre
                        }
                      </TableCell>

                      <TableCell>
                        {
                          element.ubicacion
                        }
                      </TableCell>

                      <TableCell>
                        {
                          element.tipoAlarma
                        }
                      </TableCell>

                      <TableCell>

                        <Typography
                          fontWeight="bold"
                          color={
                            element.habilitada
                              ? "green"
                              : "red"
                          }
                        >
                          {
                            element.habilitada
                              ? "HABILITADA"
                              : "DESHABILITADA"
                          }
                        </Typography>

                      </TableCell>

                      <TableCell>

                        {
                          element.consumoLimite
                        }
                        {" "}
                        {
                          element.unidad
                        }
                        {" / "}
                        {
                          element.periodo
                        }

                      </TableCell>

                      <TableCell>
                        {
                          element.prioridad
                        }
                      </TableCell>

                      <TableCell>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            flexWrap:
                              "wrap"
                          }}
                        >

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              <EditIcon />
                            }
                            onClick={
                              () => abrirModalEditarAlarma(element)
                            }
                            sx={{
                              backgroundColor:
                                "#1565C0",

                              '&:hover': {
                                backgroundColor:
                                  "#0D47A1"
                              }
                            }}
                          >
                            EDITAR
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              <DeleteIcon />
                            }
                            onClick={
                              () => {
                                setAlarmaAEliminar(element);
                                setOpenConfirmEliminarAlarma(true);
                              }
                            }
                            disabled={cargando}
                            sx={{
                              backgroundColor:
                                "#C62828",

                              '&:hover': {
                                backgroundColor:
                                  "#B71C1C"
                              }
                            }}
                          >
                            ELIMINAR
                          </Button>

                        </div>

                      </TableCell>

                    </TableRow>

                  )
                )}

              </TableBody>

            </Table>

          </TableContainer>

        </AccordionDetails>

      </Accordion>

            {/* CONFIGURACION USUARIOS */}
      <Accordion
        sx={{
          marginBottom:
            "20px",
          borderRadius:
            "12px !important",
          overflow:
            "hidden"
        }}
      >

        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon />
          }
          sx={{
            backgroundColor:
              "#37474F",
            color:
              "white"
          }}
        >

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "10px"
            }}
          >

            <PersonIcon />

            <Typography
              fontWeight="bold"
            >
              CONFIGURACIÓN
              DE USUARIOS
            </Typography>

          </div>

        </AccordionSummary>

        <AccordionDetails>

          {/* BOTON NUEVO USUARIO */}
          <div
            style={{
              marginBottom:
                "20px"
            }}
          >

            <Button
              variant="contained"
              startIcon={
                <AddIcon />
              }
              onClick={abrirModalNuevoUsuario}
              sx={{
                backgroundColor:
                  "#2E7D32",

                '&:hover': {
                  backgroundColor:
                    "#1B5E20"
                }
              }}
            >
              USUARIO
            </Button>

          </div>


          {/* TABLA USUARIOS */}
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              borderRadius:
                "15px",
              overflow:
                "hidden"
            }}
          >

            <Table>

              <TableHead>

                <TableRow
                  sx={{
                    backgroundColor:
                      "#37474F"
                  }}
                >

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    USUARIO
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    EMAIL
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ROL
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ESTADO
                  </TableCell>

                  <TableCell
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    ACCIÓN
                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {usuarios?.map(
                  (
                    element: any
                  ) => (

                    <TableRow
                      key={
                        element.username
                      }
                      hover
                      sx={{
                        transition:
                          "0.2s",

                        '&:hover': {
                          backgroundColor:
                            "#ECEFF1"
                        }
                      }}
                    >

                      <TableCell>
                        {
                          element.username
                        }
                      </TableCell>

                      <TableCell>
                        {
                          element.email
                        }
                      </TableCell>

                      <TableCell>
                        {
                          element.role
                        }
                      </TableCell>

                      <TableCell>

                        <Typography
                          fontWeight="bold"
                          color={
                            element.enabled
                              ? "green"
                              : "red"
                          }
                        >
                          {
                            element.enabled
                              ? "HABILITADO"
                              : "DESHABILITADO"
                          }
                        </Typography>

                      </TableCell>

                      <TableCell>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            flexWrap:
                              "wrap"
                          }}
                        >

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              <EditIcon />
                            }
                            onClick={
                              () => abrirModalEditarUsuario(element)
                            }
                            sx={{
                              backgroundColor:
                                "#1565C0",

                              '&:hover': {
                                backgroundColor:
                                  "#0D47A1"
                              }
                            }}
                          >
                            EDITAR
                          </Button>

                            {
                            element.role
                            !==
                            "ADMIN"
                            && (

                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  <DeleteIcon />
                                }
                                onClick={
                                  () => abrirConfirmEliminarUsuario(element)
                                }
                                disabled={cargando}
                                sx={{
                                  backgroundColor:
                                    "#C62828",

                                  '&:hover': {
                                    backgroundColor:
                                      "#B71C1C"
                                  }
                                }}
                              >
                                ELIMINAR
                              </Button>

                            )
                          }

                        </div>

                      </TableCell>

                    </TableRow>

                  )
                )}

              </TableBody>

            </Table>

          </TableContainer>

        </AccordionDetails>

      </Accordion>


      {/* MODAL ALARMA */}
      <Dialog
        open={
          openModalAlarma
        }
        onClose={
          () =>
            setOpenModalAlarma(
              false
            )
        }
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle>
          {
            modoModalAlarma
          }
          {" "}
          CONFIGURACIÓN
          DE ALARMA
        </DialogTitle>

        <DialogContent>

          {modoModalAlarma === "EDITAR" && (
            <TextField
              fullWidth
              margin="normal"
              label="ID de Configuración"
              type="number"
              value={formAlarma.configuracionAlarmaId}
              disabled
            />
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel id="dispositivo-select-label">Dispositivo</InputLabel>
            <Select
              labelId="dispositivo-select-label"
              label="Dispositivo"
              value={formAlarma.dispositivoId}
              onChange={(e) => {
                const dispositivoId = e.target.value;

                const dispositivoSeleccionado = dispositivos?.find(
                  (dispositivo: any) =>
                    String(dispositivo.dispositivoId) === String(dispositivoId)
                );

                setFormAlarma({
                  ...formAlarma,
                  dispositivoId,
                  nombre: dispositivoSeleccionado?.nombre || "",
                  ubicacion: dispositivoSeleccionado?.ubicacion || ""
                });
              }}
            >
              <MenuItem value="">
                <em>Seleccionar dispositivo</em>
              </MenuItem>
              {dispositivos?.map((dispositivo: any) => (
                <MenuItem
                  key={dispositivo.dispositivoId}
                  value={String(dispositivo.dispositivoId)}
                >
                  {`${dispositivo.dispositivoId} - ${dispositivo.nombre}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Nombre"
            value={formAlarma.nombre}
            disabled
          />

          <TextField
            fullWidth
            margin="normal"
            label="Ubicación"
            value={formAlarma.ubicacion}
            disabled
          />



          <TextField
            fullWidth
            margin="normal"
            label="Tipo de alarma"
            value="CONSUMO_EXCEDIDO"
            disabled
          />

          <TextField
            fullWidth
            margin="normal"
            label="Consumo límite"
            type="number"
            inputProps={{ min: 1 }}
            value={formAlarma.consumoLimite}
            onChange={(e) => {
              const valor = Number(e.target.value);

              if (valor >= 0 || e.target.value === "") {
                setFormAlarma({
                  ...formAlarma,
                  consumoLimite: valor
                });
              }
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Unidad"
            value="kWh"
            disabled
          />

          <FormControl
            fullWidth
            margin="normal"
          >
            <InputLabel>
              Periodo
            </InputLabel>

            <Select
              value={formAlarma.periodo}
              label="Periodo"
              onChange={(e) => setFormAlarma({...formAlarma, periodo: e.target.value})}
            >
              <MenuItem value="DIARIO">DIARIO</MenuItem>
              <MenuItem value="SEMANAL">SEMANAL</MenuItem>
              <MenuItem value="MENSUAL">MENSUAL</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            margin="normal"
          >
            <InputLabel>
              Prioridad
            </InputLabel>

            <Select
              value={formAlarma.prioridad}
              label="Prioridad"
              onChange={(e) => setFormAlarma({...formAlarma, prioridad: e.target.value})}
            >
              <MenuItem value="BAJA">BAJA</MenuItem>
              <MenuItem value="MEDIA">MEDIA</MenuItem>
              <MenuItem value="ALTA">ALTA</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Mensaje"
            value={formAlarma.mensaje}
            onChange={(e) => setFormAlarma({...formAlarma, mensaje: e.target.value})}
            multiline
            minRows={3}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formAlarma.habilitada}
                onChange={(e) => setFormAlarma({...formAlarma, habilitada: e.target.checked})}
              />
            }
            label="Habilitada"
          />

        </DialogContent>

        <DialogActions>

          <Button
            onClick={
              () =>
                setOpenModalAlarma(
                  false
                )
            }
            disabled={cargando}
          >
            CANCELAR
          </Button>

          <Button
            variant="contained"
            onClick={guardarAlarma}
            disabled={cargando}
            sx={{
              backgroundColor:
                "#2E7D32",
              '&:hover': {
                backgroundColor:
                  "#1B5E20"
              }
            }}
          >
            {cargando ? "GUARDANDO..." : "GUARDAR"}
          </Button>

        </DialogActions>

      </Dialog>

      <Dialog
        open={openConfirmEliminarAlarma}
        onClose={cancelarEliminarAlarma}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            {`¿Desea eliminar la configuración de alarma "${alarmaAEliminar?.nombre}"?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelarEliminarAlarma}
            disabled={cargando}
          >
            CANCELAR
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarEliminarAlarma}
            disabled={cargando}
          >
            {cargando ? "ELIMINANDO..." : "ELIMINAR"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL USUARIO */}
      <Dialog
        open={
          openModalUsuario
        }
        onClose={
          () =>
            setOpenModalUsuario(
              false
            )
        }
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle>
          {
            modoModalUsuario
          }
          {" "}
          USUARIO
        </DialogTitle>

        <DialogContent>

          <TextField
            fullWidth
            margin="normal"
            label="Username"
            value={formUsuario.username}
            onChange={(e) => setFormUsuario({...formUsuario, username: e.target.value})}
            disabled={modoModalUsuario === "EDITAR"}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={formUsuario.password}
            onChange={(e) => setFormUsuario({...formUsuario, password: e.target.value})}
            placeholder={modoModalUsuario === "EDITAR" ? "Dejar en blanco para no cambiar" : ""}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Email"
            value={formUsuario.email}
            onChange={(e) => setFormUsuario({...formUsuario, email: e.target.value})}
          />

          <FormControl
            fullWidth
            margin="normal"
          >

            <InputLabel>
              Rol
            </InputLabel>

            <Select
              value={formUsuario.role}
              label="Rol"
              onChange={(e) => setFormUsuario({...formUsuario, role: e.target.value})}
              disabled={esAdminEditando}
            >

              <MenuItem
                value="ADMIN"
              >
                ADMIN
              </MenuItem>

              <MenuItem
                value="USER"
              >
                USER
              </MenuItem>

            </Select>

          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formUsuario.enabled}
                onChange={(e) => setFormUsuario({...formUsuario, enabled: e.target.checked})}
                disabled={esAdminEditando}
              />
            }
            label="Habilitado"
          />

        </DialogContent>

        <DialogActions>

          <Button
            onClick={
              () => {
                setOpenModalUsuario(false);
                limpiarFormUsuario();
              }
            }
            disabled={cargando}
          >
            CANCELAR
          </Button>

          <Button
            variant="contained"
            onClick={guardarUsuario}
            disabled={cargando}
            sx={{
              backgroundColor:
                "#2E7D32",
              '&:hover': {
                backgroundColor:
                  "#1B5E20"
              }
            }}
          >
            {cargando ? "GUARDANDO..." : "GUARDAR"}
          </Button>

        </DialogActions>

      </Dialog>

      <Dialog
        open={openConfirmEliminar}
        onClose={cancelarEliminarUsuario}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            {`¿Desea eliminar al usuario "${usuarioAEliminar?.username}"?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelarEliminarUsuario}
            disabled={cargando}
          >
            CANCELAR
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarEliminarUsuario}
            disabled={cargando}
          >
            {cargando ? "ELIMINANDO..." : "ELIMINAR"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={cerrarSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={cerrarSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* FOOTER */}
      <Paper
        elevation={4}
        sx={{
          marginTop:
            "35px",
          marginBottom:
            "-24px",
          background:
            "#263238",
          color:
            "white",
          padding:
            "22px",
          textAlign:
            "center",
          borderRadius:
            "12px 12px 0 0"
        }}
      >

        <Typography
          variant="h6"
          sx={{
            fontWeight:
              "bold",
            marginBottom:
              "8px"
          }}
        >
          SISTEMA IoT DE
          MONITOREO ELÉCTRICO
        </Typography>

        <Typography
          variant="body2"
          sx={{
            marginBottom:
              "18px",
            color:
              "#CFD8DC"
          }}
        >
          Plataforma para monitoreo
          de variables eléctricas
          en tiempo real
        </Typography>


        <div
          style={{
            display:
              "flex",
            justifyContent:
              "center",
            gap:
              "15px",
            marginBottom:
              "15px",
            flexWrap:
              "wrap"
          }}
        >

          <Button
            variant="contained"
            href="https://github.com/"
            target="_blank"
            startIcon={
              <GitHubIcon />
            }
            sx={{
              backgroundColor:
                "#424242",

              '&:hover': {
                backgroundColor:
                  "#212121"
              }
            }}
          >
            GitHub
          </Button>

          <Button
            variant="contained"
            href="https://linkedin.com/"
            target="_blank"
            startIcon={
              <LinkedInIcon />
            }
            sx={{
              backgroundColor:
                "#1565C0",

              '&:hover': {
                backgroundColor:
                  "#0D47A1"
              }
            }}
          >
            LinkedIn
          </Button>

          <Button
            variant="contained"
            href="https://instagram.com/"
            target="_blank"
            startIcon={
              <InstagramIcon />
            }
            sx={{
              backgroundColor:
                "#AD1457",

              '&:hover': {
                backgroundColor:
                  "#880E4F"
              }
            }}
          >
            Instagram
          </Button>

        </div>

        <Typography
          variant="body2"
          sx={{
            color:
              "#B0BEC5"
          }}
        >
          Proyecto Final - CeIoT
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color:
              "#90A4AE"
          }}
        >
          Ingeniería Electrónica
          • IoT •
          Monitoreo Energético
        </Typography>

      </Paper>

    </Layout>

  )

}

export default Configuracion