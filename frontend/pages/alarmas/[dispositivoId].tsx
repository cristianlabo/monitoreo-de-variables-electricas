import React from "react"
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import {
  useAlarmasById,
  resolverAlarma
} from "../../api"

import {
  Layout
} from "../../Components"

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

const DispositivoId: NextPage = () => {

  const router =
    useRouter();

  const {
    dispositivoId
  } = router.query ?? {};

  const onBack =
    () => {
      router.back();
    }

  const {
    alarmas,
    mutateAlarma
  } =
    useAlarmasById(
      dispositivoId
    );

  const onResolverAlarma =
    async (
      alarmaId: number
    ) => {

      try {

        await resolverAlarma(
          alarmaId
        );

        mutateAlarma();

      } catch (
        error
      ) {

        console.log(
          "ERROR RESOLVIENDO ALARMA",
          error
        );
      }
    }

  return (

    <Layout>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >

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

          <WarningAmberIcon
            sx={{
              fontSize:
                55,
              color:
                "#FFC107"
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
          >
            ALARMAS DEL
            DISPOSITIVO
          </Typography>

          <Typography
            variant="body2"
          >
            Historial de
            alarmas
            registradas para
            el dispositivo
            seleccionado
          </Typography>

        </Paper>


        {/* BOTON VOLVER ARRIBA */}
        <div
          style={{
            marginBottom:
              "20px",
            display:
              "flex",
            justifyContent:
              "flex-start"
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

                {[
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
                          "Estado",
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

                    <TableCell
                      align="center"
                    >

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
            marginTop:
              "20px",
            marginBottom:
              "20px",
            display:
              "flex",
            justifyContent:
              "flex-start"
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


        {/* FOOTER */}
        <Paper
          elevation={4}
          sx={{
            marginTop:
              "auto",
            background:
              "#263238",
            color:
              "white",
            padding:
              "22px",
            textAlign:
              "center",
            borderRadius:
              "12px"
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


          {/* REDES */}
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
              startIcon={<GitHubIcon />}
              href="https://github.com/"
              target="_blank"
              sx={{
                backgroundColor:
                  "#424242"
              }}
            >
              GitHub
            </Button>

            <Button
              variant="contained"
              startIcon={<LinkedInIcon />}
              href="https://linkedin.com/"
              target="_blank"
              sx={{
                backgroundColor:
                  "#1565C0"
              }}
            >
              LinkedIn
            </Button>

            <Button
              variant="contained"
              startIcon={<InstagramIcon />}
              href="https://instagram.com/"
              target="_blank"
              sx={{
                backgroundColor:
                  "#AD1457"
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
            Ingeniería Electrónica • IoT • Monitoreo Energético
          </Typography>

        </Paper>

      </div>

    </Layout>
  )
}

export default DispositivoId