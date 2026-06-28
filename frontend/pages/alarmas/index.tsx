import React from "react"
import type { NextPage } from 'next'
import { useRouter } from "next/router"

import {
  useAlarmasList,
  resolverAlarma
} from "../../api"

import { Layout } from "../../Components"

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material"

import WarningAmberIcon
from '@mui/icons-material/WarningAmber'

import GitHubIcon
from '@mui/icons-material/GitHub'

import LinkedInIcon
from '@mui/icons-material/LinkedIn'

import InstagramIcon
from '@mui/icons-material/Instagram'

const Alarmas: NextPage = () => {

  const router =
    useRouter();

  const { role } =
    router.query;

  const {
    alarmas,
    mutateAlarmas
  } = useAlarmasList();

  const onResolverAlarma =
    async (
      alarmaId: number
    ) => {

      try {

        await resolverAlarma(
          alarmaId
        );

        mutateAlarmas();

      } catch (error) {

        console.log(
          "ERROR RESOLVIENDO ALARMA",
          error
        );
      }
    }

  const onBack =
    () => {

      router.push(
        `/home?role=${role}`
      );

    }

  return (

    <Layout>

      {/* HEADER */}
      <Paper
        elevation={4}
        sx={{
          background: "#263238",
          color: "white",
          padding: "25px",
          marginBottom: "25px",
          borderRadius: "12px",
          textAlign: "center"
        }}
      >

        <WarningAmberIcon
          sx={{
            fontSize: 55,
            color: "#FFC107"
          }}
        />

        <Typography
          variant="h4"
          fontWeight="bold"
        >
          ALARMAS ELÉCTRICAS
        </Typography>

        <Typography
          variant="body2"
        >
          Visualizacion de alarmas
          por consumo eléctrico
        </Typography>

      </Paper>


      {/* BOTON VOLVER ARRIBA */}
      <div
        style={{
          marginBottom: "20px"
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


      {/* TABLA */}
      <TableContainer
        component={Paper}
        elevation={4}
        sx={{
          borderRadius: "15px",
          overflow: "hidden"
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

              {[
                "ID",
                "Dispositivo",
                "Ubicación",
                "Tipo",
                "Descripción",
                "Estado",
                "Consumo",
                "Límite",
                "Periodo",
                "Fecha Evento",
                "Acción"
              ].map(
                (
                  title
                ) => (

                  <TableCell
                    key={title}
                    align={
                      [
                        "Consumo",
                        "Límite",
                        "Acción"
                      ].includes(
                        title
                      )
                        ? "center"
                        : "left"
                    }
                    sx={{
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    {title}
                  </TableCell>
                )
              )}

            </TableRow>

          </TableHead>

          <TableBody>

            {alarmas?.map(
              (
                element: any,
                index: number
              ) => (

                <TableRow
                  key={index}
                  hover
                  sx={{
                    transition:
                      "0.2s",

                    '&:hover': {
                      backgroundColor:
                        "#ECEFF1",
                      transform:
                        "scale(1.002)"
                    }
                  }}
                >

                  <TableCell>
                    {
                      element
                        .dispositivoId
                    }
                  </TableCell>

                  <TableCell>
                    {
                      element
                        .nombre
                    }
                  </TableCell>

                  <TableCell>
                    {
                      element
                        .ubicacion
                    }
                  </TableCell>

                  <TableCell>
                    {
                      element
                        .tipoAlarma
                    }
                  </TableCell>

                  <TableCell>
                    {
                      element
                        .descripcion
                    }
                  </TableCell>

                  <TableCell>

                    <Typography
                      sx={{
                        color:
                          element.estado ===
                          "activa"
                            ? "#D32F2F"
                            : "#2E7D32",
                        fontWeight:
                          "bold"
                      }}
                    >
                      {
                        element
                          .estado
                      }
                    </Typography>

                  </TableCell>

                  <TableCell
                    align="center"
                  >
                    {
                      element.consumoActual
                      ?? "-"
                    }{" "}
                    {
                      element.unidad
                      ?? ""
                    }
                  </TableCell>

                  <TableCell
                    align="center"
                  >
                    {
                      element.consumoLimite
                      ?? "-"
                    }{" "}
                    {
                      element.unidad
                      ?? ""
                    }
                  </TableCell>

                  <TableCell>
                    {
                      element.periodo
                      ?? "-"
                    }
                  </TableCell>


                  <TableCell>
                    {
                      new Date(
                        element.fechaEvento
                      ).toLocaleString(
                        "es-AR",
                        {
                          hour12:
                            false
                        }
                      )
                    }
                  </TableCell>

                  <TableCell
                    align="center"
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "8px",
                        justifyContent:
                          "center",
                        flexWrap:
                          "wrap"
                      }}
                    >

                      {
                        element.estado ===
                        "activa" && (

                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            sx={{
                              textTransform:
                                "none",
                              borderRadius:
                                "8px"
                            }}
                            onClick={() =>
                              onResolverAlarma(
                                element.alarmaId
                              )
                            }
                          >
                            Resolver
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


      {/* BOTON VOLVER ABAJO */}
      <div
        style={{
          marginTop: "20px",
          marginBottom: "20px"
        }}
      >
        <Button
          variant="contained"
          onClick={onBack}
          sx={{
            backgroundColor: "#455A64",
            paddingX: "20px",

            '&:hover': {
              backgroundColor: "#37474F"
            }
          }}
        >
          VOLVER
        </Button>
      </div>


      {/* FOOTER */}
      <Paper
        elevation={4}
        sx={{
          marginTop: "35px",
          marginBottom: "-24px",
          background: "#263238",
          color: "white",
          padding: "22px",
          textAlign: "center",
          borderRadius: "12px 12px 0 0"
        }}
      >

        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            marginBottom: "8px"
          }}
        >
          SISTEMA IoT DE
          MONITOREO ELÉCTRICO
        </Typography>

        <Typography
          variant="body2"
          sx={{
            marginBottom: "18px",
            color: "#CFD8DC"
          }}
        >
          Plataforma para monitoreo
          de variables eléctricas
          en tiempo real
        </Typography>


        {/* REDES */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "15px",
            flexWrap: "wrap"
          }}
        >

          <Button
            variant="contained"
            href="https://github.com/"
            target="_blank"
            startIcon={<GitHubIcon />}
            sx={{
              backgroundColor: "#424242",

              '&:hover': {
                backgroundColor: "#212121"
              }
            }}
          >
            GitHub
          </Button>

          <Button
            variant="contained"
            href="https://linkedin.com/"
            target="_blank"
            startIcon={<LinkedInIcon />}
            sx={{
              backgroundColor: "#1565C0",

              '&:hover': {
                backgroundColor: "#0D47A1"
              }
            }}
          >
            LinkedIn
          </Button>

          <Button
            variant="contained"
            href="https://instagram.com/"
            target="_blank"
            startIcon={<InstagramIcon />}
            sx={{
              backgroundColor: "#AD1457",

              '&:hover': {
                backgroundColor: "#880E4F"
              }
            }}
          >
            Instagram
          </Button>

        </div>

        <Typography
          variant="body2"
          sx={{
            color: "#B0BEC5"
          }}
        >
          Proyecto Final - CeIoT
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: "#90A4AE"
          }}
        >
          Ingeniería Electrónica • IoT • Monitoreo Energético
        </Typography>

      </Paper>

    </Layout>
  )
}

export default Alarmas